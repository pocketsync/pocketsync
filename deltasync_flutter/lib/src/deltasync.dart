import 'dart:async';
import 'dart:developer';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:deltasync_flutter/src/models/delta_sync_options.dart';
import 'package:deltasync_flutter/src/services/device_manager.dart';
import 'package:deltasync_flutter/src/services/sync_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqlite3/sqlite3.dart';
import 'package:synchronized/synchronized.dart';
import 'services/change_tracker.dart';
import 'errors/sync_error.dart';

const kDefaultSyncInternal = Duration(seconds: 10);

class DeltaSync {
  static final DeltaSync instance = DeltaSync._();
  DeltaSync._();

  Database? _db;
  ChangeTracker? _changeTracker;
  SyncService? _syncService;
  DeviceManager? _deviceManager;
  bool _isInitialized = false;
  int _lastProcessedChangeId = 0;
  Timer? _syncTimer;
  String? _userId;
  final _syncController = StreamController<ChangeSet>.broadcast();
  StreamSubscription? _schemaChangeSubscription;
  SharedPreferences? _sharedPreferences;
  Duration? _syncInterval;
  bool _isSyncing = false;

  // Add new fields for sync state management
  final _syncLock = Lock();
  static const _syncTimeout = Duration(minutes: 5);
  DateTime? _lastSyncAttempt;

  Stream<ChangeSet> get changes => _syncController.stream;

  Future<void> initialize({
    required String dbPath,
    Duration syncInterval = const Duration(seconds: 30),
    required DeltaSyncOptions options,
  }) async {
    if (_isInitialized) return;

    try {
      _syncInterval = syncInterval;
      _db = sqlite3.open(dbPath);
      _sharedPreferences = await SharedPreferences.getInstance();
      _deviceManager = DeviceManager(_sharedPreferences!);
      _changeTracker = ChangeTracker(_db!, _deviceManager!.getDeviceId());

      await _changeTracker!.setupTracking();
      _lastProcessedChangeId = await _changeTracker!.getLastProcessedChangeId();

      _syncService = SyncService(
        serverUrl: options.serverUrl,
        projectId: options.projectId,
        apiKey: options.projectApiKey,
        userIdentifier: _userId ?? '',
        changeTracker: _changeTracker!,
        deviceManager: _deviceManager!,
      );

      await _initializeWatcher();

      _isInitialized = true;
    } catch (e, stackTrace) {
      await dispose();
      throw SyncError('Failed to initialize DeltaSync: $e\n$stackTrace');
    }
  }

  Future<void> setUserId({required String userId}) async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');

    // Pause sync while updating user ID
    final wasRunning = _syncTimer != null;
    if (wasRunning) {
      await pauseSync();
    }

    try {
      _userId = userId;
      if (_syncService != null) {
        _syncService!.dispose();

        _syncService = SyncService(
          serverUrl: _syncService!.serverUrl,
          projectId: _syncService!.projectId,
          apiKey: _syncService!.apiKey,
          userIdentifier: userId,
          changeTracker: _changeTracker!,
          deviceManager: _deviceManager!,
        );
      }
    } finally {
      if (wasRunning && _isInitialized) {
        await resumeSync();
      }
    }
  }

  Future<void> startSync() async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    if (_userId == null) throw StateError('User ID not set');

    _startPeriodicSync(_syncInterval);
  }

  Future<void> _checkForChanges() async {
    if (!_isInitialized) return;

    // Check if we're already syncing or if we've synced too recently
    if (_isSyncing) {
      // Check for stuck sync state
      if (_lastSyncAttempt != null &&
          DateTime.now().difference(_lastSyncAttempt!) > _syncTimeout) {
        log('Sync appears stuck, resetting sync state');
        _isSyncing = false;
      } else {
        return;
      }
    }

    // Use a lock to prevent concurrent sync operations
    await _syncLock.synchronized(() async {
      if (_isSyncing) return;
      _isSyncing = true;
      _lastSyncAttempt = DateTime.now();

      try {
        // First process and upload local changes
        final localChangeSets =
            await _changeTracker!.generateChangeSets(_lastProcessedChangeId);
        log('Found ${localChangeSets.length} local changes to sync');

        if (localChangeSets.isNotEmpty) {
          for (final changeSet in localChangeSets) {
            if (!_isInitialized) break;

            try {
              log('Uploading change set: ${changeSet.toJson()}');
              await _syncService!.uploadChanges(changeSet);

              if (_isInitialized) {
                _syncController.add(changeSet);
              }
            } catch (e, stack) {
              // Log the error but continue processing other changes
              log('Failed to sync change set: $e\n$stack');
              await _changeTracker!.markChangeAsRetry(changeSet.timestamp);
            }
          }
        }

        // Then fetch and apply remote changes
        final remoteChanges =
            await _syncService!.fetchChanges(_lastProcessedChangeId);

        if (remoteChanges.isNotEmpty) {
          log('Applying ${remoteChanges.length} remote changes');

          for (final changeLog in remoteChanges) {
            if (!_isInitialized) break;

            _db!.execute('BEGIN TRANSACTION');
            try {
              await _changeTracker!.applyChangeSet(changeLog.changeSet);
              await _changeTracker!.updateLastProcessedChangeId(changeLog.id);
              _lastProcessedChangeId = changeLog.id;

              if (_isInitialized) {
                _syncController.add(changeLog.changeSet);
              }
              _db!.execute('COMMIT');
            } catch (e, stack) {
              log('Error applying remote changes: $e\n$stack');
              _db!.execute('ROLLBACK');
              // Don't rethrow - we want to continue processing other changes
            }
          }
        }
      } catch (e, stack) {
        if (_isInitialized) {
          log('Sync error: $e\n$stack');
          _syncController.addError(SyncError('Failed to sync changes: $e'));
        }
      } finally {
        _isSyncing = false;
        _lastSyncAttempt = null;
      }
    });
  }

  Future<void> dispose() async {
    await _syncLock.synchronized(() async {
      _syncTimer?.cancel();
      await _schemaChangeSubscription?.cancel();
      await _syncController.close();
      _syncService?.dispose();
      _db?.dispose();
      _db = null;
      _isInitialized = false;
    });
  }

  void _setupSchemaChangeListener() {
    _schemaChangeSubscription =
        _changeTracker!.schemaChanges.listen((schemaChange) {
      _syncController.addError(SyncError(
        'Schema changed for table ${schemaChange.tableName} '
        'to version ${schemaChange.version}',
      ));
      pauseSync();
    }, onError: (error) {
      _syncController
          .addError(SyncError('Failed to monitor schema changes: $error'));
    });
  }

  Future<void> _initializeWatcher() async {
    final tables = _db!.select('''
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '__deltasync_%'
      AND name NOT LIKE 'android_%'
      AND name NOT IN ('android_metadata', '_sync_metadata')
    ''').map((row) => row['name'] as String).toList();

    for (final table in tables) {
      try {
        await _changeTracker!.setupTableTracking(table);
      } catch (e) {
        log('Failed to set up tracking for table $table: $e');
      }
    }

    _setupSchemaChangeListener();
  }

  void _startPeriodicSync(Duration? interval) {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(
        interval ?? kDefaultSyncInternal, (_) => _checkForChanges());
  }

  Future<List<ChangeSet>> getChanges() async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    return await _changeTracker!.generateChangeSets(_lastProcessedChangeId);
  }

  Future<void> markChangesSynced(int changeId) async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    try {
      await _changeTracker!.markChangesAsSynced(changeId);
      if (_lastProcessedChangeId != changeId) {
        _lastProcessedChangeId = changeId;
      }
    } catch (e) {
      throw SyncError('Failed to mark changes as synced: $e');
    }
  }

  Future<void> pauseSync() async {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  Future<void> resumeSync({Duration? interval}) async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    if (_userId == null) throw StateError('User ID not set');

    _startPeriodicSync(interval ?? _syncInterval);
  }

  bool get isInitialized => _isInitialized;
  bool get isSyncing => _syncTimer != null;
  bool get isUserSet => _userId != null;
}
