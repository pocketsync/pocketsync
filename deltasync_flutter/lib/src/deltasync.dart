import 'dart:async';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:deltasync_flutter/src/models/delta_sync_options.dart';
import 'package:deltasync_flutter/src/services/device_manager.dart';
import 'package:deltasync_flutter/src/services/sync_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqlite3/sqlite3.dart';
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
      _setupSchemaChangeListener();

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
    if (!_isInitialized || _isSyncing) return;

    _isSyncing = true;
    try {
      // Fetch remote changes first
      final remoteChanges = await _syncService!.fetchChanges(_lastProcessedChangeId);
      for (final changeLog in remoteChanges) {
        if (!_isInitialized) break;
        await _changeTracker!.applyChangeSet(changeLog.changeSet);
        await _changeTracker!.updateLastProcessedChangeId(changeLog.id);
        _lastProcessedChangeId = changeLog.id;
        if (_isInitialized) {
          _syncController.add(changeLog.changeSet);
        }
      }

      // Then process and upload local changes
      final localChangeSets = await _changeTracker!.generateChangeSets(_lastProcessedChangeId);
      for (final changeSet in localChangeSets) {
        if (!_isInitialized) break;
        await _syncService!.uploadChanges(changeSet);
        if (_isInitialized) {
          _syncController.add(changeSet);
        }
      }
    } catch (e) {
      if (_isInitialized) {
        _syncController.addError(SyncError('Failed to sync changes: $e'));
      }
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> dispose() async {
    _syncTimer?.cancel();
    _syncTimer = null;
    await _schemaChangeSubscription?.cancel();
    await _syncController.close();
    _syncService?.dispose();
    _db?.dispose();
    _db = null;
    _changeTracker = null;
    _syncService = null;

    _userId = null;
    _isInitialized = false;
  }

  void _setupSchemaChangeListener() {
    _schemaChangeSubscription = _changeTracker!.schemaChanges.listen((schemaChange) {
      _syncController.addError(SyncError(
        'Schema changed for table ${schemaChange.tableName} '
        'to version ${schemaChange.version}',
      ));
      pauseSync();
    }, onError: (error) {
      _syncController.addError(SyncError('Failed to monitor schema changes: $error'));
    });
  }

  Future<void> _initializeWatcher() async {
    final tables = _db!.select('''
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '__deltasync_%'
    ''').map((row) => row['name'] as String).toList();

    for (final table in tables) {
      await _changeTracker!.setupTableTracking(table);
    }
  }

  void _startPeriodicSync(Duration? interval) {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(interval ?? kDefaultSyncInternal, (_) => _checkForChanges());
  }

  Future<List<ChangeSet>> getChanges() async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    return await _changeTracker!.generateChangeSets(_lastProcessedChangeId);
  }

  Future<void> markChangesSynced(int changeId) async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    await _changeTracker!.updateLastProcessedChangeId(changeId);
    _lastProcessedChangeId = changeId;
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    try {
      await _changeTracker!.markChangesAsSynced(changeId);
      _lastProcessedChangeId = changeId;
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
