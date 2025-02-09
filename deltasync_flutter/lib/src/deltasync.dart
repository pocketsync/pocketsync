import 'dart:async';
import 'dart:developer';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:deltasync_flutter/src/models/delta_sync_options.dart';
import 'package:deltasync_flutter/src/services/device_manager.dart';
import 'package:deltasync_flutter/src/services/sync_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqlite3/sqlite3.dart';
import 'services/change_tracker.dart';
import 'services/remote_change_listener.dart';
import 'errors/sync_error.dart';

const kDefaultSyncInternal = Duration(seconds: 10);

class DeltaSync {
  static final DeltaSync instance = DeltaSync._();
  DeltaSync._();

  Database? _db;
  ChangeTracker? _changeTracker;
  SyncService? _syncService;
  DeviceManager? _deviceManager;
  RemoteChangeListener? _remoteChangeListener;
  bool _isInitialized = false;
  int _lastSyncTimestamp = 0;
  Timer? _syncTimer;
  String? _userId;
  final _syncController = StreamController<ChangeSet>.broadcast();
  StreamSubscription? _schemaChangeSubscription;
  SharedPreferences? _sharedPreferences;
  Duration? _syncInterval;

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
      _changeTracker = ChangeTracker(_db!);
      _deviceManager = DeviceManager(_sharedPreferences!);

      _syncService = SyncService(
        serverUrl: options.serverUrl,
        projectId: options.projectId,
        apiKey: options.projectApiKey,
        userIdentifier: _userId ?? '',
        changeTracker: _changeTracker!,
        deviceManager: _deviceManager!,
      );

      await _changeTracker!.setupTracking();
      await _initializeWatcher();
      _setupSchemaChangeListener();

      if (_userId != null) {
        log('No user id, we will not be listening for changes on the server');
        await _setupRemoteChangeListener();
      }

      _isInitialized = true;
    } catch (e) {
      await dispose();
      throw SyncError('Failed to initialize DeltaSync: $e');
    }
  }

  Future<void> setUserId({required String userId}) async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
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
      await _setupRemoteChangeListener();
    }
  }

  Future<void> startSync() async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    if (_userId == null) throw StateError('User ID not set');

    _startPeriodicSync(_syncInterval);
  }

  Future<void> _checkForChanges() async {
    if (!_isInitialized) return;

    try {
      final changeSets = await _changeTracker!.generateChangeSets(_lastSyncTimestamp);
      for (final changeSet in changeSets) {
        await _syncService!.uploadChanges(changeSet);
        _syncController.add(changeSet);
      }
    } catch (e) {
      _syncController.addError(SyncError('Failed to sync changes: $e'));
    }
  }

  Future<void> _setupRemoteChangeListener() async {
    if (_remoteChangeListener != null) {
      await _remoteChangeListener!.dispose();
    }

    _remoteChangeListener = RemoteChangeListener(
      wsUrl: _syncService!.serverUrl.replaceFirst('http', 'ws'),
      deviceId: _deviceManager!.getDeviceId(),
      db: _db!,
      userId: _userId!,
    );

    await _remoteChangeListener!.connect();
    _remoteChangeListener!.changes.listen(
      (changeSet) => _syncController.add(changeSet),
      onError: (error) => _syncController.addError(SyncError('Remote change error: $error')),
    );
  }

  Future<void> dispose() async {
    _syncTimer?.cancel();
    _syncTimer = null;
    await _schemaChangeSubscription?.cancel();
    await _syncController.close();
    _syncService?.dispose();
    await _remoteChangeListener?.dispose();
    _db?.dispose();
    _db = null;
    _changeTracker = null;
    _syncService = null;
    _remoteChangeListener = null;
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
    return await _changeTracker!.generateChangeSets(_lastSyncTimestamp);
  }

  Future<void> markChangesSynced(int timestamp) async {
    if (!_isInitialized) throw StateError('DeltaSync not initialized');
    try {
      await _changeTracker!.markChangesAsSynced(timestamp);
      _lastSyncTimestamp = timestamp;
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
