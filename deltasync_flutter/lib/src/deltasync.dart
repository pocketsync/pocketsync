import 'dart:async';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:sqflite/sqflite.dart';
import 'models/delta_sync_options.dart';
import 'models/change_processing_response.dart';
import 'services/delta_sync_network_service.dart';
import 'services/changes_processor.dart';

class DeltaSync {
  static final DeltaSync instance = DeltaSync._internal();
  DeltaSync._internal();

  Database? _db;
  Timer? _syncTimer;
  String? _userId;

  late DeltaSyncNetworkService _networkService;
  late ChangesProcessor _changesProcessor;
  bool _isSyncing = false;
  Duration? _syncInterval;

  /// Initializes DeltaSync with the given configuration
  Future<void> initialize({
    required String dbPath,
    required Duration syncInterval,
    required DeltaSyncOptions options,
  }) async {
    _syncInterval = syncInterval;
    _networkService = DeltaSyncNetworkService(
      serverUrl: options.serverUrl,
      projectId: options.projectId,
      projectApiKey: options.projectApiKey,
    );
    _db = await openDatabase(
      dbPath,
      version: 1,
      onCreate: _onCreate,
      onOpen: _onOpen,
    );
    _changesProcessor = ChangesProcessor(_db!);
  }

  /// Sets up the initial database schema
  Future<void> _onCreate(Database db, int version) async {
    // Create change tracking table
    await db.execute('''
      CREATE TABLE _deltasync_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Create version tracking table
    await db.execute('''
      CREATE TABLE _deltasync_version (
        table_name TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0
      )
    ''');
  }

  /// Called when database is opened
  Future<void> _onOpen(Database db) async {
    // Set up triggers for change tracking on all user tables
    await _setupChangeTracking(db);
  }

  /// Sets up change tracking triggers for all user tables
  Future<void> _setupChangeTracking(Database db) async {
    // Get list of user tables (excluding DeltaSync system tables)
    final tables = await db.query('sqlite_master',
        where: "type = 'table' AND name NOT LIKE '_deltasync_%'");

    for (final table in tables) {
      final tableName = table['name'] as String;
      await _createTableTriggers(db, tableName);
    }
  }

  /// Creates triggers for a specific table
  Future<void> _createTableTriggers(Database db, String tableName) async {
    // Insert trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS ${tableName}_insert_trigger
      AFTER INSERT ON $tableName
      BEGIN
        INSERT INTO _deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        )
        VALUES (
          '$tableName',
          NEW.id,
          'INSERT',
          strftime('%s', 'now'),
          json_object('id', NEW.id),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM _deltasync_changes)
        );
      END;
    ''');

    // Update trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS ${tableName}_update_trigger
      AFTER UPDATE ON $tableName
      BEGIN
        INSERT INTO _deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        )
        VALUES (
          '$tableName',
          NEW.id,
          'UPDATE',
          strftime('%s', 'now'),
          json_object('id', NEW.id),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM _deltasync_changes)
        );
      END;
    ''');

    // Delete trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS ${tableName}_delete_trigger
      AFTER DELETE ON $tableName
      BEGIN
        INSERT INTO _deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        )
        VALUES (
          '$tableName',
          OLD.id,
          'DELETE',
          strftime('%s', 'now'),
          json_object('id', OLD.id),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM _deltasync_changes)
        );
      END;
    ''');
  }

  /// Sets the user ID for synchronization
  Future<void> setUserId({required String userId}) async {
    _userId = userId;
    _networkService.setUserId(userId);
  }

  /// Starts the synchronization process
  Future<void> startSync() async {
    if (_syncTimer != null) return;
    if (_syncInterval == null) throw Exception('Sync interval not set');
    if (_userId == null) throw Exception('User ID not set');

    // Start periodic sync
    _syncTimer = Timer.periodic(_syncInterval!, (_) => _sync());
    // Perform initial sync
    await _sync();
  }

  /// Pauses the synchronization process
  Future<void> pauseSync() async {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  /// Resumes the synchronization process
  Future<void> resumeSync() async {
    await startSync();
  }

  /// Internal sync method
  Future<void> _sync() async {
    if (_isSyncing || _userId == null || _db == null) return;
    _isSyncing = true;

    try {
      // Get local changes
      final changeSet = await _getLocalChanges();
      if (changeSet.insertions.changes.isEmpty &&
          changeSet.updates.changes.isEmpty &&
          changeSet.deletions.changes.isEmpty) {
        return;
      }

      // Send changes to server
      final processedResponse = await _sendChanges(changeSet);

      if (processedResponse.status == 'success' &&
          processedResponse.processed) {
        final changes = await _db!.query(
          '_deltasync_changes',
          where: 'synced = 0',
          orderBy: 'version ASC',
        );

        // Mark changes as synced
        await _markChangesSynced(changes);

        // Get and apply remote changes
        await _fetchAndApplyRemoteChanges();
      }
    } catch (e) {
      print('Sync error: $e');
    } finally {
      _isSyncing = false;
    }
  }

  /// Gets local changes that haven't been synced
  Future<ChangeSet> _getLocalChanges() async {
    return await _changesProcessor.getLocalChanges();
  }

  /// Sends changes to the server
  Future<ChangeProcessingResponse> _sendChanges(ChangeSet changes) async {
    return await _networkService.sendChanges(changes);
  }

  /// Marks changes as synced
  Future<void> _markChangesSynced(List<Map<String, dynamic>> changes) async {
    await _changesProcessor.markChangesSynced(changes);
  }

  /// Fetches and applies remote changes
  Future<void> _fetchAndApplyRemoteChanges() async {
    try {
      final remoteChanges = await _networkService.fetchRemoteChanges();
      await _changesProcessor.applyRemoteChanges(remoteChanges);
    } catch (e) {
      // TODO: handle error
    }
  }

  /// Cleans up resources
  Future<void> dispose() async {
    await pauseSync();
    await _db?.close();
    _db = null;
    _networkService.dispose();
  }
}
