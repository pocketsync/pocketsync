import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'package:deltasync_flutter/src/errors/sync_error.dart';
import 'package:deltasync_flutter/src/models/schema_change.dart';
import 'package:sqlite3/sqlite3.dart';
import '../models/change_set.dart';
import 'package:crypto/crypto.dart';

class ChangeTracker {
  final Database db;
  static const int _batchSize = 1000;
  static const int currentVersion = 1;
  final String deviceId;

  ChangeTracker(this.db, this.deviceId);

  Future<void> setupTracking() async {
    db.execute('PRAGMA journal_mode=WAL');

    await _createDeviceSyncStateTable();
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

    // Add last_modified column with a default value, then update it
    if (!columns.contains('last_modified')) {
      db.execute('BEGIN TRANSACTION');
      try {
        db.execute('''
          ALTER TABLE $tableName ADD COLUMN last_modified INTEGER DEFAULT 0
        ''');

        // Update all existing rows with current timestamp and create initial change records
        final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
        final existingRows = db.select('SELECT oid as rowid, * FROM $tableName');

        for (final row in existingRows) {
          final rowId = row['rowid'];
          final rowData = Map<String, dynamic>.from(row);
          rowData.remove('rowid'); // Remove rowid from the data to avoid duplication

          // Check if there's already a pending insert for this row
          final existingChange = db.select('''
            SELECT id FROM __deltasync_changes 
            WHERE table_name = ? AND row_id = ? AND operation = 'INSERT' AND sync_status = 'pending'
          ''', [tableName, rowId]);

          if (existingChange.isEmpty) {
            db.execute('''
              INSERT INTO __deltasync_changes (
                table_name, row_id, operation, timestamp, change_data, sync_status
              ) VALUES (?, ?, ?, ?, ?, ?)
            ''', [
              tableName,
              rowId,
              'INSERT',
              now,
              jsonEncode({'new': rowData, 'schema_version': schemaVersion, 'row_id': rowId}),
              'pending'
            ]);
          }
        }

        db.execute('''
          UPDATE $tableName 
          SET last_modified = ?
          WHERE last_modified = 0
        ''', [now]);

        db.execute('COMMIT');
      } catch (e) {
        db.execute('ROLLBACK');
        rethrow;
      }
    }

    db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_update_$tableName
      AFTER UPDATE ON $tableName
      WHEN ${_generateUpdateCondition(columns)} AND NOT (NEW.last_modified != OLD.last_modified AND NEW.last_modified = strftime('%s', 'now'))
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
            'schema_version', $schemaVersion,
            'row_id', NEW.rowid
          )
        );
        UPDATE $tableName SET last_modified = strftime('%s', 'now') 
        WHERE rowid = NEW.rowid;
      END;
    ''');

    db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_delete_$tableName
      AFTER DELETE ON $tableName
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, row_id, operation, timestamp, change_data
        ) VALUES (
          '$tableName',
          OLD.rowid,
          'DELETE',
          strftime('%s', 'now'),
          json_object(
            'old', json_object(${_generateColumnList(tableName, prefix: 'OLD')}),
            'schema_version', $schemaVersion
          )
        );
      END;
    ''');
  }

  String _generateUpdateCondition(List<String> columns) {
    return columns.where((col) => col != 'last_modified').map((col) => '''(
          OLD.$col IS NOT NEW.$col OR 
          (OLD.$col IS NULL AND NEW.$col IS NOT NULL) OR 
          (OLD.$col IS NOT NULL AND NEW.$col IS NULL)
        )''').join(' OR ');
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

  final _schemaChangeController = StreamController<SchemaChange>.broadcast();
  Stream<SchemaChange> get schemaChanges => _schemaChangeController.stream;

  void _notifySchemaChange(String tableName, int newVersion) {
    _schemaChangeController.add(SchemaChange(
        tableName: tableName, version: newVersion, timestamp: DateTime.now().millisecondsSinceEpoch ~/ 1000));
  }

  void dispose() {
    _schemaChangeController.close();
  }

  Future<void> _createDeviceSyncStateTable() async {
    db.execute('''
      CREATE TABLE IF NOT EXISTS __deltasync_device_state (
        device_id TEXT PRIMARY KEY,
        last_processed_change_id INTEGER NOT NULL DEFAULT 0,
        last_sync_timestamp INTEGER NOT NULL DEFAULT 0
      )
    ''');
  }

  Future<int> getLastProcessedChangeId() async {
    final result =
        db.select('SELECT last_processed_change_id FROM __deltasync_device_state WHERE device_id = ?', [deviceId]);
    return result.isEmpty ? 0 : result.first['last_processed_change_id'] as int;
  }

  Future<void> updateLastProcessedChangeId(int changeId) async {
    db.execute('''
      INSERT INTO __deltasync_device_state (device_id, last_processed_change_id, last_sync_timestamp)
      VALUES (?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        last_processed_change_id = excluded.last_processed_change_id,
        last_sync_timestamp = excluded.last_sync_timestamp
    ''', [deviceId, changeId, DateTime.now().millisecondsSinceEpoch ~/ 1000]);
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
        AND id > ?
        ORDER BY timestamp ASC
        LIMIT ? OFFSET ?
      ''', [lastSyncTimestamp, await getLastProcessedChangeId(), _batchSize, currentBatch * _batchSize]);

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
        final rowId = change['row_id'] as int;
        maxTimestamp = timestamp > maxTimestamp ? timestamp : maxTimestamp;

        switch (operation) {
          case 'INSERT':
            final insertData = changeData['new'] as Map<String, dynamic>;
            insertData['row_id'] = rowId;
            insertionMap.putIfAbsent(tableName, () => {}).add(jsonEncode(insertData));
            break;
          case 'UPDATE':
            final modifiedColumns = changeData['modified_columns'] as Map<String, dynamic>;
            final updateData = Map.fromEntries(modifiedColumns.entries.where((e) => e.value != null));
            if (updateData.isNotEmpty) {
              updateData['row_id'] = rowId;
              updateMap.putIfAbsent(tableName, () => {}).add(jsonEncode(updateData));
            }
            break;
          case 'DELETE':
            final deleteData = changeData['old'] as Map<String, dynamic>;
            deleteData['row_id'] = rowId;
            deletionMap.putIfAbsent(tableName, () => {}).add(jsonEncode(deleteData));
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

  Future<void> applyChangeSet(ChangeSet changeSet) async {
    db.execute('BEGIN TRANSACTION');
    try {
      // Apply deletions first to avoid conflicts
      for (final tableName in changeSet.deletions.changes.keys) {
        final rows = changeSet.deletions.changes[tableName]!.rows;
        for (final rowData in rows) {
          final data = json.decode(rowData);
          db.execute('DELETE FROM $tableName WHERE rowid = ?', [data['rowid']]);

          log('Deleted ${data['rowid']} in $tableName');
        }
      }

      // Apply updates
      for (final tableName in changeSet.updates.changes.keys) {
        final rows = changeSet.updates.changes[tableName]!.rows;
        for (final rowData in rows) {
          final data = json.decode(rowData);
          final rowId = data['rowid'];
          data.remove('rowid');

          final setClause = data.keys.map((key) => '$key = ?').join(', ');
          final values = [...data.values, rowId];

          final exists = db.select('SELECT 1 FROM $tableName WHERE rowid = ?', [rowId]).isNotEmpty;
          if (exists) {
            db.execute(
              'UPDATE $tableName SET $setClause, last_modified = ? WHERE rowid = ?',
              [...values, changeSet.timestamp, rowId],
            );
          }

          log('Updated $values in $tableName');
        }
      }

      for (final tableName in changeSet.insertions.changes.keys) {
        final rows = changeSet.insertions.changes[tableName]!.rows;
        for (final rowData in rows) {
          final data = json.decode(rowData);
          final rowId = data.remove('row_id');

          final exists = db.select('SELECT 1 FROM $tableName WHERE rowid = ?', [rowId]).isNotEmpty;
          if (exists) {
            final setClause = data.keys.map((key) => '$key = ?').join(', ');
            final values = [...data.values];

            db.execute(
              'UPDATE $tableName SET $setClause, last_modified = ? WHERE rowid = ?',
              [...values, changeSet.timestamp, rowId],
            );
          } else {
            final columns = data.keys.join(', ');
            final placeholders = List.filled(data.length, '?').join(', ');
            final values = data.values.toList();

            db.execute(
              'INSERT INTO $tableName ($columns, last_modified) VALUES ($placeholders, ?)',
              [...values, changeSet.timestamp],
            );

            log('Inserted $values in $tableName');
          }
        }
      }

      db.execute('COMMIT');
    } catch (e) {
      db.execute('ROLLBACK');
      throw SyncError('Failed to apply change set: $e');
    }
  }

  Future<void> _markChangeAsError(int changeId) async {
    try {
      db.execute('BEGIN IMMEDIATE TRANSACTION');
      db.execute('''
        UPDATE __deltasync_changes 
        SET retry_count = retry_count + 1 
        WHERE id = ?
      ''', [changeId]);
      db.execute('COMMIT');
    } catch (e) {
      db.execute('ROLLBACK');
      throw SyncError('Failed to mark change as error: $e');
    }
  }

  String _generateColumnList(String tableName, {String prefix = 'NEW'}) {
    final columns =
        db.select("SELECT name FROM pragma_table_info('$tableName')").map((row) => row['name'] as String).toList();

    return columns.map((col) => "'$col', $prefix.$col").join(', ');
  }
}
