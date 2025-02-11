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
  bool _isApplyingRemoteChanges = false;

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
        final now = DateTime.now().millisecondsSinceEpoch;

        // Get table info to find the primary key column
        final tableInfo = db.select("SELECT * FROM pragma_table_info(?)", [tableName]);
        final pkColumn = tableInfo.firstWhere((col) => col['pk'] == 1,
            orElse: () => throw StateError('Table $tableName has no primary key'));
        final pkColumnName = pkColumn['name'] as String;

        final existingRows = db.select('''
          SELECT *, $pkColumnName as _primary_key FROM $tableName
        ''');

        for (final row in existingRows) {
          final rowId = row['_primary_key'];
          final rowData = Map<String, Object?>.from(row);
          rowData.remove('_primary_key');
          rowData['id'] = rowId;

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
              jsonEncode({'new': rowData, 'schema_version': schemaVersion}),
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

    _createTriggers(tableName, schemaVersion);
  }

  void _createTriggers(String tableName, int schemaVersion) {
    db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_update_$tableName
      AFTER UPDATE ON $tableName
      WHEN ${_generateUpdateCondition(db.select("SELECT name FROM pragma_table_info(?)", [
                  tableName
                ]).map((row) => row['name'] as String).toList())} AND NOT EXISTS (SELECT 1 FROM __deltasync_device_state WHERE device_id = '$deviceId' AND last_fetched_at = (strftime('%s', 'now') * 1000))
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, row_id, operation, timestamp, change_data
        ) VALUES (
          '$tableName',
          NEW.rowid,
          'UPDATE',
          (strftime('%s', 'now') * 1000),
          json_object(
            'modified_columns', json_patch(
              json_object(${_generateModifiedColumnsOld(db.select("SELECT name FROM pragma_table_info(?)", [
                  tableName
                ]).map((row) => row['name'] as String).toList())}),
              json_object(${_generateModifiedColumnsNew(db.select("SELECT name FROM pragma_table_info(?)", [
                  tableName
                ]).map((row) => row['name'] as String).toList())})
            ),
            'schema_version', $schemaVersion
          )
        );
        UPDATE $tableName SET last_modified = (strftime('%s', 'now') * 1000) 
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
          (strftime('%s', 'now') * 1000),
          json_object(
            'new', json_object(${_generateColumnList(tableName)}),
            'schema_version', $schemaVersion
          )
        );
        UPDATE $tableName SET last_modified = (strftime('%s', 'now') * 1000) 
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
          (strftime('%s', 'now') * 1000),
          json_object(
            'old', json_object(${_generateColumnList(tableName, prefix: 'OLD')}),
            'schema_version', $schemaVersion
          )
        );
      END;
    ''');
  }

  String _generateUpdateCondition(List<String> columns) {
    final conditions = columns.where((col) => col != 'last_modified').map((col) => '''(
          OLD.$col IS NOT NEW.$col OR 
          (OLD.$col IS NULL AND NEW.$col IS NOT NULL) OR 
          (OLD.$col IS NOT NULL AND NEW.$col IS NULL) OR
          (OLD.$col != NEW.$col)
        )''').join(' OR ');

    return "($conditions) AND NOT (NEW.last_modified != OLD.last_modified AND NEW.last_modified = (strftime('%s', 'now') * 1000))";
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
      tableName: tableName,
      version: newVersion,
      timestamp: DateTime.now().millisecondsSinceEpoch ~/ 1000,
    ));
  }

  void dispose() {
    _schemaChangeController.close();
  }

  Future<void> _createDeviceSyncStateTable() async {
    db.execute('''
      CREATE TABLE IF NOT EXISTS __deltasync_device_state (
        device_id TEXT PRIMARY KEY,
        last_fetched_at INTEGER NOT NULL DEFAULT 0
      )
    ''');
  }

  Future<DateTime> getLastFetchedAt() async {
    final result = db.select('SELECT last_fetched_at FROM __deltasync_device_state WHERE device_id = ?', [deviceId]);

    if (result.isEmpty) {
      db.execute(
        'INSERT INTO __deltasync_device_state (device_id, last_fetched_at) VALUES (?, ?)',
        [deviceId, 0],
      );
      return DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
    }

    return DateTime.fromMillisecondsSinceEpoch(result.first['last_fetched_at'] as int, isUtc: true);
  }

  Future<void> updateLastFetchedAt(DateTime timestamp) async {
    db.execute('''
      INSERT OR REPLACE INTO __deltasync_device_state (device_id, last_fetched_at)
      VALUES (?, ?)
    ''', [deviceId, timestamp.millisecondsSinceEpoch]);
  }

  void resetFailedChanges() {
    db.execute('''
      UPDATE __deltasync_changes 
      SET retry_count = 0,
          sync_status = 'pending'
      WHERE sync_status = 'failed'
    ''');
  }

  Future<List<ChangeSet>> generateChangeSets(DateTime lastSyncTimestamp) async {
    final changeSets = <ChangeSet>[];

    // First check if we have any pending changes at all
    final hasPendingChanges = db.select('''
      SELECT * FROM __deltasync_changes 
      WHERE sync_status = 'pending' AND retry_count < 3
      LIMIT 1
    ''').isNotEmpty;

    if (!hasPendingChanges) {
      log('No pending changes found');
      return changeSets;
    }

    // Process changes in batches
    var offset = 0;
    final batchSize = _batchSize;

    while (true) {
      final changes = db.select('''
        SELECT * FROM __deltasync_changes 
        WHERE sync_status = 'pending'
        AND retry_count < 3
        ORDER BY id ASC
        LIMIT ? OFFSET ?
      ''', [batchSize, offset]);

      if (changes.isEmpty) break;

      final changeSet = await _processChangeBatch(changes);

      if (changeSet.insertions.changes.isNotEmpty ||
          changeSet.updates.changes.isNotEmpty ||
          changeSet.deletions.changes.isNotEmpty) {
        changeSets.add(changeSet);
      }

      offset += changes.length;

      if (changes.length < batchSize) break;
    }

    return changeSets;
  }

  Future<void> markChangesAsSynced(List<ChangeSet> changeSets) async {
    for (final changeSet in changeSets) {
      db.execute('''
        UPDATE __deltasync_changes 
        SET sync_status = 'synced'
        WHERE timestamp <= ? AND sync_status = 'pending'
      ''', [changeSet.timestamp]);
    }
  }

  Future<ChangeSet> _processChangeBatch(List<Map<String, dynamic>> changes) async {
    final insertionMap = <String, List<Map<String, dynamic>>>{};
    final updateMap = <String, List<Map<String, dynamic>>>{};
    final deletionMap = <String, List<Map<String, dynamic>>>{};
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
            final cleanData = <String, dynamic>{'row_id': rowId, 'last_modified': timestamp, ...insertData};
            insertionMap.putIfAbsent(tableName, () => []).add(cleanData);
            break;
          case 'UPDATE':
            final modifiedColumns = changeData['modified_columns'] as Map<String, dynamic>;
            if (modifiedColumns.isNotEmpty) {
              final cleanData = <String, dynamic>{'row_id': rowId, 'last_modified': timestamp, ...modifiedColumns};
              updateMap.putIfAbsent(tableName, () => []).add(cleanData);
            }
            break;
          case 'DELETE':
            final cleanData = {'row_id': rowId};
            deletionMap.putIfAbsent(tableName, () => []).add(cleanData);
            break;
        }
      } catch (e, stack) {
        await _markChangeAsError(change['id'] as int);
        log('Error processing change: $e\n$stack');
        throw SyncError('Failed to process change: $e');
      }
    }

    return ChangeSet(
      timestamp: maxTimestamp,
      version: currentVersion,
      insertions: TableChanges(
        insertionMap.map((k, v) => MapEntry(k, TableRows(v))),
      ),
      updates: TableChanges(
        updateMap.map((k, v) => MapEntry(k, TableRows(v))),
      ),
      deletions: TableChanges(
        deletionMap.map((k, v) => MapEntry(k, TableRows(v))),
      ),
    );
  }

  Future<void> applyChangeSet(ChangeSet changeSet) async {
    log('Applying change set ${changeSet.toJson()}');
    // if (_isApplyingRemoteChanges) return;
    _isApplyingRemoteChanges = true;
    try {
      for (final tableName in changeSet.deletions.changes.keys) {
        final rows = changeSet.deletions.changes[tableName]!.rows;
        for (final rowData in rows) {
          final rowId = rowData['row_id'] as int;
          final exists = db.select('SELECT * FROM $tableName WHERE rowid = ?', [rowId]).isNotEmpty;
          if (exists) {
            db.execute('DELETE FROM $tableName WHERE rowid = ?', [rowId]);
            log('Deleted row with ID $rowId in $tableName');
          }
        }
      }

      // Process insertions and updates
      for (final tableName in changeSet.insertions.changes.keys) {
        final rows = changeSet.insertions.changes[tableName]!.rows;
        for (final rowData in rows) {
          _applyInsertOrUpdate(tableName, rowData);
        }
      }

      for (final tableName in changeSet.updates.changes.keys) {
        final rows = changeSet.updates.changes[tableName]!.rows;
        for (final rowData in rows) {
          _applyInsertOrUpdate(tableName, rowData);
        }
      }
    } catch (e, stack) {
      log('Error applying change set: $e\n$stack');
    } finally {
      _isApplyingRemoteChanges = false;
    }
  }

  void _applyInsertOrUpdate(String tableName, Map<String, dynamic> rowData) {
    final rowId = rowData['row_id'] as int;
    final incomingLastModified = rowData['last_modified'] as int;

    final existingRow = db.select(
      'SELECT *, last_modified AS localLastModified FROM $tableName WHERE rowid = ?',
      [rowId],
    ).firstOrNull;

    if (existingRow != null) {
      final localLastModified = existingRow['localLastModified'] as int;
      if (incomingLastModified > localLastModified) {
        _updateRow(tableName, rowData);
        log('Updated row with ID $rowId in $tableName (Last Write Wins)');
      }
    } else {
      _insertRow(tableName, rowData);
      log('Inserted new row with ID $rowId in $tableName');
    }
  }

  void _insertRow(String tableName, Map<String, dynamic> rowData) {
    final cleanData = Map<String, dynamic>.from(rowData)..remove('row_id');

    final columns = cleanData.keys.join(', ');
    final placeholders = cleanData.keys.map((_) => '?').join(', ');
    final values = cleanData.values.toList();

    final sql = 'INSERT INTO $tableName ($columns) VALUES ($placeholders)';
    db.execute(sql, values);

    // show proof in console
    final allRows = db.select('SELECT * FROM $tableName');
    log('All rows in $tableName: $allRows');

    log('Inserted new row in $tableName: $cleanData');
  }

  void _updateRow(String tableName, Map<String, dynamic> rowData) {
    final rowId = rowData['row_id'] as int;
    final lastModified = rowData['last_modified'] as int;

    final existingRow = db.select('SELECT last_modified FROM $tableName WHERE rowid = ?', [rowId]);

    if (existingRow.isNotEmpty && existingRow.first['last_modified'] >= lastModified) {
      log('Skipped update for rowid $rowId because incoming data is stale.');
      return;
    }

    final cleanData = Map<String, dynamic>.from(rowData)..remove('row_id');

    final columns = cleanData.keys.where((key) => key != 'row_id').toList();
    final setClause = columns.map((col) => '$col = ?').join(', ');
    final values = columns.map((col) => cleanData[col]).toList();
    values.add(rowId);

    final sql = 'UPDATE $tableName SET $setClause WHERE rowid = ?';
    db.execute(sql, values);

    log('Updated row in $tableName with rowid $rowId: $cleanData');
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
