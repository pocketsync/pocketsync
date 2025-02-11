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

  String _generateGlobalId(int localId) {
    return "$deviceId:$localId";
  }

  int? _extractSourceLocalId(String globalId) {
    return int.tryParse(globalId.split(':')[1]);
  }

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
        row_id TEXT NOT NULL,
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
    final columns =
        db.select("SELECT * FROM pragma_table_info(?)", [tableName]);
    if (columns.isEmpty) throw SyncError('Table $tableName does not exist');

    final schemaHash = _generateSchemaHash(columns);
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;

    final existing = db.select(
        'SELECT schema_hash, schema_version FROM __deltasync_versions WHERE table_name = ?',
        [tableName]);

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
    final schemaString =
        (columns.map((col) => '${col['name']}:${col['type']}').toList()..sort())
            .join(',');

    return sha256.convert(utf8.encode(schemaString)).toString();
  }

  Future<void> setupTableTracking(String tableName) async {
    final schemaVersion = await _updateTableVersion(tableName);
    final columns = db
        .select("SELECT name FROM pragma_table_info(?)", [tableName])
        .map((row) => row['name'] as String)
        .toList();

    // Add last_modified column with a default value, then update it
    if (!columns.contains('last_modified')) {
      db.execute('BEGIN TRANSACTION');
      try {
        db.execute('''
          ALTER TABLE $tableName ADD COLUMN last_modified INTEGER DEFAULT 0
        ''');

        // Update all existing rows with current timestamp and create initial change records
        final now = DateTime.now().millisecondsSinceEpoch;
        final existingRows =
            db.select('SELECT oid as rowid, * FROM $tableName');

        for (final row in existingRows) {
          final localId = row['rowid'] as int;
          final globalId = _generateGlobalId(localId);
          final rowData = Map<String, dynamic>.from(row);
          rowData.remove('rowid');
          rowData['id'] = globalId;

          // Check if there's already a pending insert for this row
          final existingChange = db.select('''
            SELECT id FROM __deltasync_changes 
            WHERE table_name = ? AND row_id = ? AND operation = 'INSERT' AND sync_status = 'pending'
          ''', [tableName, globalId]);

          if (existingChange.isEmpty) {
            db.execute('''
              INSERT INTO __deltasync_changes (
                table_name, row_id, operation, timestamp, change_data, sync_status
              ) VALUES (?, ?, ?, ?, ?, ?)
            ''', [
              tableName,
              globalId,
              'INSERT',
              now,
              jsonEncode({
                'new': rowData,
                'schema_version': schemaVersion,
                'row_id': globalId
              }),
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
    // Common global_id format for all operations
    final globalIdExpr = "'$deviceId:' || NEW.rowid";

    db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_update_$tableName
      AFTER UPDATE ON $tableName
      WHEN ${_generateUpdateCondition(db.select("SELECT name FROM pragma_table_info(?)", [
                  tableName
                ]).map((row) => row['name'] as String).toList())} AND NOT (NEW.last_modified != OLD.last_modified AND NEW.last_modified = (strftime('%s', 'now') * 1000))
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, row_id, operation, timestamp, change_data
        ) VALUES (
          '$tableName',
          $globalIdExpr,
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
            'schema_version', $schemaVersion,
            'global_id', $globalIdExpr
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
          $globalIdExpr,
          'INSERT',
          (strftime('%s', 'now') * 1000),
          json_object(
            'new', json_object(${_generateColumnList(tableName)}),
            'schema_version', $schemaVersion,
            'global_id', $globalIdExpr
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
          '$deviceId:' || OLD.rowid,
          'DELETE',
          (strftime('%s', 'now') * 1000),
          json_object(
            'old', json_object(${_generateColumnList(tableName, prefix: 'OLD')}),
            'schema_version', $schemaVersion,
            'global_id', '$deviceId:' || OLD.rowid
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
        .map((col) =>
            "'$col', CASE WHEN OLD.$col IS NOT NEW.$col THEN OLD.$col ELSE NULL END")
        .join(', ');
  }

  String _generateModifiedColumnsNew(List<String> columns) {
    return columns
        .where((col) => col != 'last_modified')
        .map((col) =>
            "'$col', CASE WHEN OLD.$col IS NOT NEW.$col THEN NEW.$col ELSE NULL END")
        .join(', ');
  }

  final _schemaChangeController = StreamController<SchemaChange>.broadcast();
  Stream<SchemaChange> get schemaChanges => _schemaChangeController.stream;

  void _notifySchemaChange(String tableName, int newVersion) {
    _schemaChangeController.add(SchemaChange(
        tableName: tableName,
        version: newVersion,
        timestamp: DateTime.now().millisecondsSinceEpoch ~/ 1000));
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
    final result = db.select(
        'SELECT last_processed_change_id FROM __deltasync_device_state WHERE device_id = ?',
        [deviceId]);

    // Debug: Check device state
    final allDeviceStates = db.select('SELECT * FROM __deltasync_device_state');
    log('All device states: $allDeviceStates');
    log('Current device ID: $deviceId');

    if (result.isEmpty) {
      // Initialize device state if it doesn't exist
      db.execute(
          'INSERT INTO __deltasync_device_state (device_id, last_processed_change_id) VALUES (?, 0)',
          [deviceId]);
      return 0;
    }

    return result.first['last_processed_change_id'] as int;
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

  int _convertToMillis(int timestamp) {
    // Convert seconds to milliseconds if needed
    return timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
  }

  Future<void> markChangeAsRetry(int timestamp) async {
    final millisTimestamp = _convertToMillis(timestamp);

    db.execute('''
      UPDATE __deltasync_changes 
      SET retry_count = retry_count + 1,
          sync_status = CASE 
            WHEN retry_count >= 2 THEN 'failed'
            ELSE 'pending'
          END
      WHERE timestamp = ?
    ''', [millisTimestamp]);

    // Notify about permanently failed changes
    final failedChanges = db.select('''
      SELECT * FROM __deltasync_changes 
      WHERE timestamp = ? AND sync_status = 'failed'
    ''', [millisTimestamp]);

    for (final change in failedChanges) {
      _schemaChangeController.addError(SyncError(
          'Change permanently failed after 3 retries: ${change['table_name']} - ${change['operation']} - ${change['row_id']}'));
    }
  }

  void resetFailedChanges() {
    db.execute('''
      UPDATE __deltasync_changes 
      SET retry_count = 0,
          sync_status = 'pending'
      WHERE sync_status = 'failed'
    ''');
  }

  Future<List<ChangeSet>> generateChangeSets(int lastSyncTimestamp) async {
    final changeSets = <ChangeSet>[];
    var currentBatch = 0;
    final millisTimestamp = _convertToMillis(lastSyncTimestamp);
    final lastProcessedId = await getLastProcessedChangeId();

    // Debug: Check what's in the changes table
    final allChanges = db.select('SELECT * FROM __deltasync_changes');
    log('All changes in table: $allChanges');

    // Debug: Check our query parameters
    log('Query params: lastSyncTimestamp=$millisTimestamp, lastProcessedId=$lastProcessedId');

    while (true) {
      final changes = db.select('''
        SELECT * FROM __deltasync_changes 
        WHERE timestamp > ? 
        AND sync_status = 'pending'
        AND retry_count < 3
        AND id > ?
        ORDER BY timestamp ASC
        LIMIT ? OFFSET ?
      ''', [
        millisTimestamp,
        lastProcessedId,
        _batchSize,
        currentBatch * _batchSize
      ]);

      // Debug: Check if we got any changes
      log('Changes found for batch $currentBatch: ${changes.length}');
      if (changes.isNotEmpty) {
        log('First change: ${changes.first}');
      }

      if (changes.isEmpty) break;

      final changeSet = await _processChangeBatch(changes);
      changeSets.add(changeSet);

      currentBatch++;
    }

    return changeSets;
  }

  Future<void> markChangesAsSynced(int upToTimestamp) async {
    final millisTimestamp = _convertToMillis(upToTimestamp);

    db.execute('''
      UPDATE __deltasync_changes 
      SET sync_status = 'synced'
      WHERE timestamp <= ? AND sync_status = 'pending'
    ''', [millisTimestamp]);
  }

  Future<ChangeSet> _processChangeBatch(
      List<Map<String, dynamic>> changes) async {
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
        final globalId = changeData['global_id'] as String?;

        if (globalId == null) {
          log('Warning: Row missing global_id in change: $changeData');
          continue;
        }

        maxTimestamp = timestamp > maxTimestamp ? timestamp : maxTimestamp;

        switch (operation) {
          case 'INSERT':
            final insertData = changeData['new'] as Map<String, dynamic>;
            // Create clean data with required ID fields
            final cleanData = <String, dynamic>{
              'global_id': globalId, // Use global_id as expected by backend
              ...insertData
            };
            insertionMap.putIfAbsent(tableName, () => []).add(cleanData);
            break;
          case 'UPDATE':
            final modifiedColumns =
                changeData['modified_columns'] as Map<String, dynamic>;
            if (modifiedColumns.isNotEmpty) {
              final cleanData = <String, dynamic>{
                'global_id': globalId, // Use global_id as expected by backend
                ...modifiedColumns
              };
              updateMap.putIfAbsent(tableName, () => []).add(cleanData);
            }
            break;
          case 'DELETE':
            final cleanData = {
              'global_id': globalId
            }; // Use global_id as expected by backend
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
    // Process deletions first
    for (final tableName in changeSet.deletions.changes.keys) {
      final rows = changeSet.deletions.changes[tableName]!.rows;
      for (final rowData in rows) {
        try {
          final rawId = rowData['global_id']?.toString() ?? // Prefer global_id
              rowData['id']?.toString();
          if (rawId == null) {
            log('Warning: Row missing ID: $rowData');
            continue;
          }

          String globalId;
          int? localId;

          // Check if this is already a global ID (contains device prefix)
          if (rawId.contains(':')) {
            globalId = rawId;
            localId = _extractSourceLocalId(globalId);
          } else {
            // This is a plain ID from the server
            localId = int.tryParse(rawId);
            globalId = '$deviceId:$rawId';
          }

          if (localId != null) {
            final exists = db.select('SELECT 1 FROM $tableName WHERE rowid = ?',
                [localId]).isNotEmpty;
            if (exists) {
              db.execute('DELETE FROM $tableName WHERE rowid = ?', [localId]);
              log('Deleted row with ID $localId in $tableName');
            }
          }
        } catch (e, stack) {
          log('Error processing deletion: $e\n$stack');
        }
      }
    }

    // Apply updates and insertions
    for (final tableName in {
      ...changeSet.updates.changes.keys,
      ...changeSet.insertions.changes.keys
    }) {
      final updates = changeSet.updates.changes[tableName]?.rows ?? [];
      final insertions = changeSet.insertions.changes[tableName]?.rows ?? [];

      for (final rowData in [...updates, ...insertions]) {
        final rawId = rowData['global_id']?.toString() ?? // Prefer global_id
            rowData['id']?.toString();
        if (rawId == null) {
          log('Warning: Row missing ID: $rowData');
          continue;
        }

        String deviceId;
        int? remoteId;

        // Check if this is already a global ID (contains device prefix)
        if (rawId.contains(':')) {
          final parts = rawId.split(':');
          if (parts.length != 2) {
            log('Warning: Invalid global_id format: $rawId');
            continue;
          }
          deviceId = parts[0];
          remoteId = int.tryParse(parts[1]);
        } else {
          // This is a plain ID from the server
          remoteId = int.tryParse(rawId);
          deviceId = this.deviceId; // Assume it's from our device
        }

        if (remoteId == null) {
          log('Warning: Invalid ID format: $rawId');
          continue;
        }

        // Create a copy of rowData to avoid modifying the original
        final cleanData = Map<String, dynamic>.from(rowData)
          ..remove('global_id') // Remove ID fields from database operations
          ..remove('id');

        if (deviceId == this.deviceId) {
          // This is our own change coming back from the server
          final exists = db.select('SELECT 1 FROM $tableName WHERE rowid = ?',
              [remoteId]).isNotEmpty;
          if (exists) {
            // Update existing row
            final setClause =
                cleanData.keys.map((key) => '$key = ?').join(', ');
            db.execute(
              'UPDATE $tableName SET $setClause, last_modified = ? WHERE rowid = ?',
              [...cleanData.values, changeSet.timestamp, remoteId],
            );
            log('Updated existing row with ID $remoteId in $tableName');
          }
        } else {
          // This is a change from another device
          final columns = cleanData.keys.join(', ');
          final placeholders =
              List.filled(cleanData.length + 2, '?').join(', ');

          try {
            db.execute(
              'INSERT INTO $tableName (rowid, $columns, last_modified) VALUES ($placeholders)',
              [remoteId, ...cleanData.values, changeSet.timestamp],
            );
            log('Inserted new row with ID $remoteId in $tableName');
          } catch (e) {
            if (e.toString().contains('UNIQUE constraint failed')) {
              // Row already exists, update it instead
              final setClause =
                  cleanData.keys.map((key) => '$key = ?').join(', ');
              db.execute(
                'UPDATE $tableName SET $setClause, last_modified = ? WHERE rowid = ?',
                [...cleanData.values, changeSet.timestamp, remoteId],
              );
              log('Updated existing remote row with ID $remoteId in $tableName');
            } else {
              rethrow;
            }
          }
        }
      }
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
    final columns = db
        .select("SELECT name FROM pragma_table_info('$tableName')")
        .map((row) => row['name'] as String)
        .toList();

    return columns.map((col) => "'$col', $prefix.$col").join(', ');
  }
}
