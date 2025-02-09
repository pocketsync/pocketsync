import 'dart:async';
import 'dart:convert';
import 'package:deltasync_flutter/src/errors/sync_error.dart';
import 'package:deltasync_flutter/src/models/schema_change.dart';
import 'package:sqlite3/sqlite3.dart';
import '../models/change_set.dart';
import 'package:crypto/crypto.dart';

class ChangeTracker {
  final Database db;
  static const int _batchSize = 1000;
  static const int currentVersion = 1;

  ChangeTracker(this.db);

  Future<void> setupTracking() async {
    db.execute('PRAGMA journal_mode=WAL');

    await _createChangeTrackingTable();
    await _createVersionTrackingTable();
  }

  Future<void> _createChangeTrackingTable() async {
    db.execute('''
      CREATE TABLE IF NOT EXISTS __deltasync_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        row_id INTEGER NOT NULL,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        change_data TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0
      )
    ''');
  }

  Future<void> _createVersionTrackingTable() async {
    db.execute('''
      CREATE TABLE IF NOT EXISTS __deltasync_versions (
        table_name TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        schema_hash TEXT NOT NULL,
        last_modified INTEGER NOT NULL,
        PRIMARY KEY (table_name)
      )
    ''');
  }

  Future<int> _updateTableVersion(String tableName) async {
    final columns = db.select("SELECT * FROM pragma_table_info(?)", [tableName]);
    if (columns.isEmpty) throw SyncError('Table $tableName does not exist');

    final schemaHash = _generateSchemaHash(columns);
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;

    final existing =
        db.select('SELECT schema_hash, schema_version FROM __deltasync_versions WHERE table_name = ?', [tableName]);

    if (existing.isEmpty) {
      db.execute('''
        INSERT INTO __deltasync_versions (table_name, schema_version, schema_hash, last_modified)
        VALUES (?, 1, ?, ?)
      ''', [tableName, schemaHash, now]);
      _notifySchemaChange(tableName, 1);
      return 1;
    } else if (existing.first['schema_hash'] != schemaHash) {
      final newVersion = (existing.first['schema_version'] as int) + 1;
      db.execute('''
        UPDATE __deltasync_versions 
        SET schema_version = ?, schema_hash = ?, last_modified = ?
        WHERE table_name = ?
      ''', [newVersion, schemaHash, now, tableName]);
      _notifySchemaChange(tableName, newVersion);
      return newVersion;
    }

    return existing.first['schema_version'] as int;
  }

  String _generateSchemaHash(List<Map<String, dynamic>> columns) {
    final schemaString = (columns.map((col) => '${col['name']}:${col['type']}').toList()..sort()).join(',');

    return sha256.convert(utf8.encode(schemaString)).toString();
  }

  Future<void> setupTableTracking(String tableName) async {
    final schemaVersion = await _updateTableVersion(tableName);
    final columns =
        db.select("SELECT name FROM pragma_table_info(?)", [tableName]).map((row) => row['name'] as String).toList();

    // Add last_modified column if it doesn't exist
    db.execute('''
      ALTER TABLE $tableName ADD COLUMN IF NOT EXISTS last_modified INTEGER 
      DEFAULT (strftime('%s', 'now'))
    ''');

    // Create update trigger with optimized change tracking
    db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_update_$tableName
      AFTER UPDATE ON $tableName
      WHEN ${_generateUpdateCondition(columns)}
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, row_id, operation, timestamp, change_data
        ) VALUES (
          '$tableName',
          NEW.rowid,
          'UPDATE',
          strftime('%s', 'now'),
          json_object(
            'modified_columns', json_patch(
              json_object(${_generateModifiedColumnsOld(columns)}),
              json_object(${_generateModifiedColumnsNew(columns)})
            ),
            'schema_version', $schemaVersion
          )
        );
        UPDATE $tableName SET last_modified = strftime('%s', 'now') 
        WHERE rowid = NEW.rowid;
      END;
    ''');

    // Create insert trigger with version check
    db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_insert_$tableName
      AFTER INSERT ON $tableName
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, row_id, operation, timestamp, change_data
        ) VALUES (
          '$tableName',
          NEW.rowid,
          'INSERT',
          strftime('%s', 'now'),
          json_object(
            'new', json_object(${_generateColumnList(tableName)}),
            'schema_version', $schemaVersion
          )
        );
        UPDATE $tableName SET last_modified = strftime('%s', 'now') 
        WHERE rowid = NEW.rowid;
      END;
    ''');
  }

  String _generateUpdateCondition(List<String> columns) {
    return columns.where((col) => col != 'last_modified').map((col) => '(OLD.$col IS NOT NEW.$col)').join(' OR ');
  }

  String _generateModifiedColumnsOld(List<String> columns) {
    return columns
        .where((col) => col != 'last_modified')
        .map((col) => "'$col', CASE WHEN OLD.$col IS NOT NEW.$col THEN OLD.$col ELSE NULL END")
        .join(', ');
  }

  String _generateModifiedColumnsNew(List<String> columns) {
    return columns
        .where((col) => col != 'last_modified')
        .map((col) => "'$col', CASE WHEN OLD.$col IS NOT NEW.$col THEN NEW.$col ELSE NULL END")
        .join(', ');
  }

  // Add schema change notification support
  final _schemaChangeController = StreamController<SchemaChange>.broadcast();
  Stream<SchemaChange> get schemaChanges => _schemaChangeController.stream;

  void _notifySchemaChange(String tableName, int newVersion) {
    _schemaChangeController.add(SchemaChange(
        tableName: tableName, version: newVersion, timestamp: DateTime.now().millisecondsSinceEpoch ~/ 1000));
  }

  void dispose() {
    _schemaChangeController.close();
  }

  Future<List<ChangeSet>> generateChangeSets(int lastSyncTimestamp) async {
    final changeSets = <ChangeSet>[];
    var currentBatch = 0;

    while (true) {
      final changes = db.select('''
        SELECT * FROM __deltasync_changes 
        WHERE timestamp > ? 
        AND sync_status = 'pending'
        AND retry_count < 3
        ORDER BY timestamp ASC
        LIMIT ? OFFSET ?
      ''', [lastSyncTimestamp, _batchSize, currentBatch * _batchSize]);

      if (changes.isEmpty) break;

      try {
        final changeSet = await _processChangeBatch(changes);
        changeSets.add(changeSet);
      } catch (e) {
        throw SyncError('Failed to process change batch: $e');
      }

      currentBatch++;
    }

    return changeSets;
  }

  Future<ChangeSet> _processChangeBatch(List<Map<String, dynamic>> changes) async {
    final insertionMap = <String, Set<String>>{};
    final updateMap = <String, Set<String>>{};
    final deletionMap = <String, Set<String>>{};
    int maxTimestamp = 0;

    for (final change in changes) {
      try {
        final tableName = change['table_name'] as String;
        final changeData = jsonDecode(change['change_data'] as String);
        final operation = change['operation'] as String;
        final timestamp = change['timestamp'] as int;
        maxTimestamp = timestamp > maxTimestamp ? timestamp : maxTimestamp;

        switch (operation) {
          case 'INSERT':
            insertionMap.putIfAbsent(tableName, () => {}).add(jsonEncode(changeData['new']));
            break;
          case 'UPDATE':
            updateMap.putIfAbsent(tableName, () => {}).add(jsonEncode(changeData['new']));
            break;
          case 'DELETE':
            deletionMap.putIfAbsent(tableName, () => {}).add(jsonEncode(changeData['old']));
            break;
        }
      } catch (e) {
        await _markChangeAsError(change['id'] as int);
        throw SyncError('Failed to process change: $e');
      }
    }

    return ChangeSet(
      timestamp: maxTimestamp,
      version: currentVersion,
      insertions: TableChanges(insertionMap.map((k, v) => MapEntry(k, TableRows(v.toList())))),
      updates: TableChanges(updateMap.map((k, v) => MapEntry(k, TableRows(v.toList())))),
      deletions: TableChanges(deletionMap.map((k, v) => MapEntry(k, TableRows(v.toList())))),
    );
  }

  Future<void> markChangesAsSynced(int upToTimestamp) async {
    try {
      db.execute('BEGIN TRANSACTION');
      db.execute('''
      UPDATE __deltasync_changes 
      SET sync_status = 'synced' 
      WHERE timestamp <= ? AND sync_status = 'pending'
    ''', [upToTimestamp]);
      db.execute('COMMIT');
    } catch (e) {
      db.execute('ROLLBACK');
      throw SyncError('Failed to mark changes as synced: $e');
    }
  }

  Future<void> _markChangeAsError(int changeId) async {
    db.execute('''
      UPDATE __deltasync_changes 
      SET retry_count = retry_count + 1 
      WHERE id = ?
    ''', [changeId]);
  }

  String _generateColumnList(String tableName, {String prefix = 'NEW'}) {
    final columns =
        db.select("SELECT name FROM pragma_table_info('$tableName')").map((row) => row['name'] as String).toList();

    return columns.map((col) => "'$col', $prefix.$col").join(', ');
  }
}
