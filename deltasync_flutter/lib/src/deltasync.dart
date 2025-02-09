import 'dart:async';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:sqlite3/sqlite3.dart';
import 'services/change_tracker.dart';
import 'errors/sync_error.dart';

class DeltaSync {
  final String dbPath;
  final String authToken;
  final String serverUrl;
  Database? _db;
  ChangeTracker? _changeTracker;
  bool _isInitialized = false;
  int _lastSyncTimestamp = 0;
  Timer? _syncTimer;
  final _syncController = StreamController<ChangeSet>.broadcast();

  DeltaSync({
    required this.dbPath,
    required this.authToken,
    required this.serverUrl,
  });

  Stream<ChangeSet> get changes => _syncController.stream;

  StreamSubscription? _schemaChangeSubscription;

  Future<void> initialize({Duration syncInterval = const Duration(seconds: 30)}) async {
    if (_isInitialized) return;

    try {
      _db = sqlite3.open(dbPath);
      _changeTracker = ChangeTracker(_db!);

      await _changeTracker!.setupTracking();
      await _initializeWatcher();
      _setupSchemaChangeListener();

      _startPeriodicSync(syncInterval);
      _isInitialized = true;
    } catch (e) {
      await dispose();
      throw SyncError('Failed to initialize DeltaSync: $e');
    }
  }

  void _setupSchemaChangeListener() {
    _schemaChangeSubscription = _changeTracker!.schemaChanges.listen((schemaChange) {
      // Notify listeners about schema changes
      _syncController.addError(SyncError('Schema changed for table ${schemaChange.tableName} '
          'to version ${schemaChange.version}'));
      // Optionally pause sync until schema change is handled
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

  void _startPeriodicSync(Duration interval) {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(interval, (_) => _checkForChanges());
  }

  Future<void> _checkForChanges() async {
    if (!_isInitialized) return;

    try {
      final changeSets = await _changeTracker!.generateChangeSets(_lastSyncTimestamp);
      for (final changeSet in changeSets) {
        _syncController.add(changeSet);
      }
    } catch (e) {
      _syncController.addError(SyncError('Failed to check for changes: $e'));
    }
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
    _startPeriodicSync(interval ?? const Duration(seconds: 30));
  }

  Future<void> dispose() async {
    _syncTimer?.cancel();
    _syncTimer = null;
    await _schemaChangeSubscription?.cancel();
    await _syncController.close();
    _db?.dispose();
    _db = null;
    _changeTracker = null;
    _isInitialized = false;
  }

  bool get isInitialized => _isInitialized;
  bool get isSyncing => _syncTimer != null;
}
