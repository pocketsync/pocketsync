import 'dart:convert';
import 'dart:developer';

import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/database/database_change.dart';
import 'package:pocketsync_flutter/src/models/change_log.dart';
import 'package:pocketsync_flutter/src/models/change_set.dart';
import 'package:pocketsync_flutter/src/services/logger_service.dart';
import 'package:sqflite/sqflite.dart';

class ChangesProcessor {
  final PocketSyncDatabase _db;
  final ConflictResolver _conflictResolver;
  final _logger = LoggerService.instance;

  ChangesProcessor(this._db, {ConflictResolver? conflictResolver})
      : _conflictResolver = conflictResolver ?? const ConflictResolver();

  /// Gets local changes formatted as a ChangeSet
  /// Uses batch processing for better performance with large datasets
  Future<ChangeSet> getUnSyncedChanges({int batchSize = 1000}) async {
    try {
      final insertions = <String, List<Row>>{};
      final updates = <String, List<Row>>{};
      final deletions = <String, List<Row>>{};
      int lastId = 0;
      int lastVersion = 0;
      final changeIds = <int>[];

      _logger.debug(
          'Starting to fetch unsynced changes with batch size: $batchSize');

      while (true) {
        List<Map<String, dynamic>> changes;
        try {
          changes = await _db.query(
            '__pocketsync_changes',
            where: 'synced = 0 AND id > ?',
            whereArgs: [lastId],
            orderBy: 'id ASC',
            limit: batchSize,
          );
        } catch (e) {
          _logger.error('Error querying changes', error: e);
          throw SyncStateError('Failed to query changes: ${e.toString()}');
        }

        if (changes.isEmpty) break;

        _logger.debug('Processing batch of ${changes.length} changes');

        for (final change in changes) {
          try {
            final id = change['id'] as int;
            final tableName = change['table_name'] as String;
            final operation = change['operation'] as String;
            final version = change['version'] as int;
            final timestamp = change['timestamp'] as int;

            Map<String, dynamic> data;
            try {
              final rawData = jsonDecode(change['data'] as String);
              if (rawData is! Map<String, dynamic>) {
                throw FormatException('Change data must be a JSON object');
              }

              data = rawData.containsKey('new')
                  ? (rawData['new'] as Map<String, dynamic>)
                  : rawData.containsKey('old')
                      ? (rawData['old'] as Map<String, dynamic>)
                      : rawData;
            } catch (e) {
              log('Error parsing change data for id $id: $e');
              throw SyncStateError(
                  'Failed to parse change data: ${e.toString()}');
            }

            // Use rowid as the primary key identifier
            final primaryKey = change['record_rowid'].toString();

            final row = Row(
              primaryKey: primaryKey,
              timestamp: timestamp,
              data: data,
              version: version,
            );

            switch (operation) {
              case 'INSERT':
                insertions.putIfAbsent(tableName, () => []).add(row);
                break;
              case 'UPDATE':
                updates.putIfAbsent(tableName, () => []).add(row);
                break;
              case 'DELETE':
                deletions.putIfAbsent(tableName, () => []).add(row);
                break;
              default:
                log('Invalid operation type: $operation');
                throw SyncStateError('Invalid operation type: $operation');
            }

            changeIds.add(id);
            lastId = id;
            if (version > lastVersion) lastVersion = version;
          } catch (e) {
            if (e is SyncError) rethrow;
            log('Error processing change: $e');
            throw SyncStateError('Failed to process change: ${e.toString()}');
          }
        }
      }

      return ChangeSet(
        timestamp: DateTime.now().millisecondsSinceEpoch,
        version: lastVersion,
        changeIds: changeIds,
        insertions: TableChanges(
          Map.fromEntries(insertions.entries
              .map((e) => MapEntry(e.key, TableRows(e.value)))),
        ),
        updates: TableChanges(
          Map.fromEntries(
              updates.entries.map((e) => MapEntry(e.key, TableRows(e.value)))),
        ),
        deletions: TableChanges(
          Map.fromEntries(deletions.entries
              .map((e) => MapEntry(e.key, TableRows(e.value)))),
        ),
      );
    } catch (e) {
      if (e is SyncError) rethrow;
      log('Unexpected error in getUnSyncedChanges: $e');
      throw SyncStateError('Failed to get unsynced changes: ${e.toString()}');
    }
  }

  /// Marks changes as synced
  Future<void> markChangesSynced(List<int> changeIds) async {
    final batch = _db.batch();
    for (final id in changeIds) {
      batch.update(
        '__pocketsync_changes',
        {'synced': 1},
        where: 'id = ?',
        whereArgs: [id],
      );
    }
    await batch.commit();
  }

  ChangeSet _computeChangeSetFromChangeLogs(Iterable<ChangeLog> changeLogs) {
    final insertions = <String, List<Row>>{};
    final updates = <String, List<Row>>{};
    final deletions = <String, List<Row>>{};

    // Process each changelog to merge changes
    for (final log in changeLogs) {
      // Merge insertions
      log.changeSet.insertions.changes.forEach((tableName, tableRows) {
        insertions.putIfAbsent(tableName, () => []).addAll(
              tableRows.rows.map(
                (row) => Row(
                  primaryKey: row.primaryKey,
                  timestamp: row.timestamp,
                  data: row.data,
                  version: row.version,
                ),
              ),
            );
      });

      // Merge updates
      log.changeSet.updates.changes.forEach((tableName, tableRows) {
        updates.putIfAbsent(tableName, () => []).addAll(
              tableRows.rows.map(
                (row) => Row(
                  primaryKey: row.primaryKey,
                  timestamp: row.timestamp,
                  data: row.data,
                  version: row.version,
                ),
              ),
            );
      });

      // Merge deletions
      log.changeSet.deletions.changes.forEach((tableName, tableRows) {
        deletions.putIfAbsent(tableName, () => []).addAll(
              tableRows.rows.map(
                (row) => Row(
                  primaryKey: row.primaryKey,
                  timestamp: row.timestamp,
                  data: row.data,
                  version: row.version,
                ),
              ),
            );
      });
    }

    // Create merged ChangeSet from all changelogs
    return ChangeSet(
      timestamp: DateTime.now().millisecondsSinceEpoch,
      version: changeLogs.isEmpty ? 0 : changeLogs.last.changeSet.version,
      changeIds: changeLogs.map((log) => log.id).toList(),
      insertions: TableChanges(
        Map.fromEntries(
          insertions.entries.map(
            (e) => MapEntry(e.key, TableRows(e.value)),
          ),
        ),
      ),
      updates: TableChanges(
        Map.fromEntries(
          updates.entries.map(
            (e) => MapEntry(e.key, TableRows(e.value)),
          ),
        ),
      ),
      deletions: TableChanges(
        Map.fromEntries(
          deletions.entries.map(
            (e) => MapEntry(e.key, TableRows(e.value)),
          ),
        ),
      ),
    );
  }

  /// Notifies database changes to registered listeners
  void _notifyChanges(ChangeSet changeSet) {
    void notifyChangesForOperation(
        Map<String, TableRows> changes, String operation) {
      for (final entry in changes.entries) {
        for (final row in entry.value.rows) {
          final change = PsDatabaseChange(
            tableName: entry.key,
            operation: operation,
            data: row.data,
            recordId: row.primaryKey,
          );
          _db.changeManager.notifyChange(change);
        }
      }
    }

    if (changeSet.isNotEmpty) {
      _logger.info('Notifying ${changeSet.length} changes');
      notifyChangesForOperation(changeSet.insertions.changes, 'INSERT');
      notifyChangesForOperation(changeSet.updates.changes, 'UPDATE');
      notifyChangesForOperation(changeSet.deletions.changes, 'DELETE');
    }
  }

  /// Applies remote changes to local database
  Future<void> applyRemoteChanges(Iterable<ChangeLog> changeLogs) async {
    if (changeLogs.isEmpty) return;

    final changeSet = _computeChangeSetFromChangeLogs(changeLogs);
    _logger.info('Applying change set with ${changeSet.length} changes');

    final affectedTables = <String>{};
    await _db.transaction((txn) async {
      // Disable triggers once for the entire transaction
      await txn.execute('PRAGMA recursive_triggers = OFF;');

      try {
        // Pre-fetch existing rows to minimize queries
        final existingRows = await _preloadExistingRows(changeSet, txn);

        // Batch process deletions first to avoid conflicts
        await _batchProcessDeletions(changeSet.deletions.changes, txn);

        // Batch process updates and insertions
        await _batchProcessModifications(
          changeSet.updates.changes,
          existingRows,
          'UPDATE',
          txn,
        );

        await _batchProcessModifications(
          changeSet.insertions.changes,
          existingRows,
          'INSERT',
          txn,
        );

        // Batch insert processed change logs
        final now = DateTime.now().toIso8601String();
        await txn.rawInsert(
          'INSERT INTO __pocketsync_processed_changes (change_log_id, processed_at) VALUES ${changeLogs.map((_) => '(?, ?)').join(', ')}',
          changeLogs.expand((log) => [log.id, now]).toList(),
        );

        // Collect affected tables
        affectedTables
          ..addAll(changeSet.insertions.changes.keys)
          ..addAll(changeSet.updates.changes.keys)
          ..addAll(changeSet.deletions.changes.keys);
      } finally {
        await txn.execute('PRAGMA recursive_triggers = ON;');
      }
    });

    if (changeSet.isNotEmpty) {
      _logger.info('Successfully applied ${changeSet.length} remote changes');
      _notifyChanges(changeSet);
    }
  }

  /// Pre-loads existing rows for all affected records to minimize database queries
  Future<Map<String, Map<String, Map<String, dynamic>>>> _preloadExistingRows(
    ChangeSet changeSet,
    Transaction txn,
  ) async {
    final result = <String, Map<String, Map<String, dynamic>>>{};
    final allChanges = {
      ...changeSet.updates.changes,
      ...changeSet.insertions.changes,
    };

    for (final entry in allChanges.entries) {
      final tableName = entry.key;
      final rows = entry.value.rows;
      if (rows.isEmpty) continue;

      // Batch fetch existing rows
      final primaryKeys = rows.map((r) => r.primaryKey).toList();
      final placeholders = List.filled(primaryKeys.length, '?').join(',');
      final existingRows = await txn.query(
        tableName,
        where: 'ps_global_id IN ($placeholders)',
        whereArgs: primaryKeys,
      );

      // Index rows by primary key
      result[tableName] = {
        for (final row in existingRows) row['ps_global_id'] as String: row,
      };
    }

    return result;
  }

  /// Batch processes deletions for better performance
  Future<void> _batchProcessDeletions(
    Map<String, TableRows> deletions,
    Transaction txn,
  ) async {
    for (final entry in deletions.entries) {
      final tableName = entry.key;
      final rows = entry.value.rows;
      if (rows.isEmpty) continue;

      final primaryKeys = rows.map((r) => r.primaryKey).toList();
      final placeholders = List.filled(primaryKeys.length, '?').join(',');

      await txn.rawDelete(
        'DELETE FROM $tableName WHERE ps_global_id IN ($placeholders)',
        primaryKeys,
      );
    }
  }

  /// Batch processes modifications (updates or inserts) with optimized conflict resolution
  Future<void> _batchProcessModifications(
    Map<String, TableRows> changes,
    Map<String, Map<String, Map<String, dynamic>>> existingRows,
    String operation,
    Transaction txn,
  ) async {
    for (final entry in changes.entries) {
      final tableName = entry.key;
      final rows = entry.value.rows;
      if (rows.isEmpty) continue;

      final tableExistingRows = existingRows[tableName] ?? {};
      final batchSize =
          100; // Process in smaller batches to avoid memory issues

      for (var i = 0; i < rows.length; i += batchSize) {
        final batch = rows.skip(i).take(batchSize);
        final validRows = <Map<String, dynamic>>[];

        for (final row in batch) {
          final existing = tableExistingRows[row.primaryKey];

          if (existing != null) {
            final existingTimestamp = existing['timestamp'] as int?;
            if (existingTimestamp != null &&
                existingTimestamp >= row.timestamp) {
              continue; // Skip if existing version is newer
            }

            final resolvedRow = await _conflictResolver.resolveConflict(
              tableName,
              existing,
              row.data,
            );
            validRows.add(resolvedRow);
          } else if (operation == 'INSERT') {
            validRows.add(row.data);
          }
        }

        if (validRows.isEmpty) continue;

        // Batch insert or update
        if (operation == 'INSERT') {
          final columns = validRows.first.keys.toList();
          final placeholders = List.filled(columns.length, '?').join(',');
          final values = validRows.map((row) => '($placeholders)').join(',');

          await txn.rawInsert(
            'INSERT OR REPLACE INTO $tableName (${columns.join(',')}) VALUES $values',
            validRows.expand((row) => columns.map((c) => row[c])).toList(),
          );
        } else {
          // For updates, use INSERT OR REPLACE to handle both insert and update cases
          final columns = validRows.first.keys.toList();
          final placeholders = List.filled(columns.length, '?').join(',');
          final values = validRows.map((row) => '($placeholders)').join(',');

          await txn.rawInsert(
            'INSERT OR REPLACE INTO $tableName (${columns.join(',')}) VALUES $values',
            validRows.expand((row) => columns.map((c) => row[c])).toList(),
          );
        }
      }
    }
  }
}
