import 'dart:convert';
import 'dart:developer';

import 'package:pocketsync_flutter/pocketsync_flutter.dart';
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

  /// Applies remote changes to local database
  Future<void> applyRemoteChanges(Iterable<ChangeLog> changeLogs) async {
    if (changeLogs.isEmpty) return;

    final changeSet = _computeChangeSetFromChangeLogs(changeLogs);
    log('Applying change set: ${changeSet.toJson()}');

    await _db.transaction((txn) async {
      Future<void> applyTableOperation(
        String tableName,
        Row row,
        String operation,
        Transaction txn,
      ) async {
        try {
          // Get existing row if any
          final existingRow = await txn.query(
            tableName,
            where: "ps_global_id = ?",
            whereArgs: [row.primaryKey],
          );

          // Apply last-write-wins conflict resolution
          if (existingRow.isNotEmpty) {
            final existingTimestamp = existingRow.first['timestamp'] as int?;
            final incomingTimestamp = row.timestamp;
            if (existingTimestamp != null &&
                existingTimestamp >= incomingTimestamp) {
              // Skip this change as we already have a newer version
              return;
            }
          }

          // Disable all triggers temporarily
          await txn.execute('PRAGMA recursive_triggers = OFF;');

          // Apply the change operation
          switch (operation) {
            case 'INSERT':
              try {
                await txn.insert(tableName, row.data);
              } catch (e) {
                // Handle insert conflict by attempting to update instead
                final existingRow = await txn.query(
                  tableName,
                  where: 'ps_global_id = ?',
                  whereArgs: [row.primaryKey],
                );
                if (existingRow.isNotEmpty) {
                  final resolvedRow = await _conflictResolver.resolveConflict(
                    tableName,
                    existingRow.first,
                    row.data,
                  );
                  await txn.update(
                    tableName,
                    resolvedRow,
                    where: 'ps_global_id = ?',
                    whereArgs: [row.primaryKey],
                  );
                } else {
                  rethrow;
                }
              }
              break;
            case 'UPDATE':
              final existingRow = await txn.query(
                tableName,
                where: 'ps_global_id = ?',
                whereArgs: [row.primaryKey],
              );
              if (existingRow.isNotEmpty) {
                final resolvedRow = await _conflictResolver.resolveConflict(
                  tableName,
                  existingRow.first,
                  row.data,
                );
                await txn.update(
                  tableName,
                  resolvedRow,
                  where: 'ps_global_id = ?',
                  whereArgs: [row.primaryKey],
                );
              } else {
                // Row does not exist, ignore
              }
              break;
            case 'DELETE':
              await txn.delete(
                tableName,
                where: 'ps_global_id = ?',
                whereArgs: [row.primaryKey],
              );
              break;
          }
        } finally {
          await txn.execute('PRAGMA recursive_triggers = ON;');
        }
      }

      // Apply all changes
      for (final entry in changeSet.insertions.changes.entries) {
        for (final row in entry.value.rows) {
          print(entry.key);
          await applyTableOperation(entry.key, row, 'INSERT', txn);
        }
      }

      for (final entry in changeSet.updates.changes.entries) {
        for (final row in entry.value.rows) {
          await applyTableOperation(entry.key, row, 'UPDATE', txn);
        }
      }

      for (final entry in changeSet.deletions.changes.entries) {
        for (final row in entry.value.rows) {
          await applyTableOperation(entry.key, row, 'DELETE', txn);
        }
      }

      // Mark these changes as processed only if all operations succeed
      final now = DateTime.now().toIso8601String();
      for (final log in changeLogs) {
        await txn.insert('__pocketsync_processed_changes', {
          'change_log_id': log.id,
          'processed_at': now,
        });
      }
    });

    if (changeSet.isNotEmpty) {
      _logger.info('Applied ${changeSet.length} remote changes');
      _db.notifyChanges();
    }
  }
}
