import 'dart:convert';
import 'package:deltasync_flutter/src/errors/sync_error.dart';
import 'package:sqlite3/sqlite3.dart';
import '../models/change_set.dart';

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

  Future<void> setupTableTracking(String tableName) async {
    final schemaVersion = await _updateTableVersion(tableName);
    
    // Add last_modified column if it doesn't exist
    db.execute('''
      ALTER TABLE $tableName ADD COLUMN IF NOT EXISTS last_modified INTEGER 
      DEFAULT (strftime('%s', 'now'))
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

    // Update other triggers similarly...
  }

  Future<int> _updateTableVersion(String tableName) async {
    final tableInfo = db.select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [tableName]);
    if (tableInfo.isEmpty) throw SyncError('Table $tableName does not exist');
    
    final schemaHash = _generateSchemaHash(tableInfo.first['sql'] as String);
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;

    // Check if schema changed
    final existing = db.select(
      'SELECT schema_hash, schema_version FROM __deltasync_versions WHERE table_name = ?',
      [tableName]
    );

    if (existing.isEmpty) {
      // New table
      db.execute('''
        INSERT INTO __deltasync_versions (table_name, schema_version, schema_hash, last_modified)
        VALUES (?, 1, ?, ?)
      ''', [tableName, schemaHash, now]);
      return 1;
    } else if (existing.first['schema_hash'] != schemaHash) {
      // Schema changed
      final newVersion = (existing.first['schema_version'] as int) + 1;
      db.execute('''
        UPDATE __deltasync_versions 
        SET schema_version = ?, schema_hash = ?, last_modified = ?
        WHERE table_name = ?
      ''', [newVersion, schemaHash, now, tableName]);
      return newVersion;
    }

    return existing.first['schema_version'] as int;
  }

  String _generateSchemaHash(String schema) {
    final bytes = utf8.encode(schema);
    return sha256.convert(bytes).toString();
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
            insertionMap.putIfAbsent(tableName, () => {})
              .add(jsonEncode(changeData['new']));
            break;
          case 'UPDATE':
            updateMap.putIfAbsent(tableName, () => {})
              .add(jsonEncode(changeData['new']));
            break;
          case 'DELETE':
            deletionMap.putIfAbsent(tableName, () => {})
              .add(jsonEncode(changeData['old']));
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
      insertions: TableChanges(
        insertionMap.map((k, v) => MapEntry(k, TableRows(v.toList())))
      ),
      updates: TableChanges(
        updateMap.map((k, v) => MapEntry(k, TableRows(v.toList())))
      ),
      deletions: TableChanges(
        deletionMap.map((k, v) => MapEntry(k, TableRows(v.toList())))
      ),
    );
  }

  Future<void> markChangesAsSynced(int upToTimestamp) async {
    try {
      db.execute('''
        UPDATE __deltasync_changes 
        SET sync_status = 'synced' 
        WHERE timestamp <= ? 
        AND sync_status = 'pending'
      ''', [upToTimestamp]);
    } catch (e) {
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
    final columns = db.select(
      "SELECT name FROM pragma_table_info('$tableName')"
    ).map((row) => row['name'] as String).toList();

    return columns.map((col) => "'$col', $prefix.$col").join(', ');
  }
}
