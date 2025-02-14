import 'dart:convert';
import 'dart:developer';

import 'package:deltasync_flutter/deltasync_flutter.dart';
import 'package:deltasync_flutter/src/models/change_log.dart';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:sqflite/sqflite.dart';

class ChangesProcessor {
  final DeltaSyncDatabase _db;
  final ConflictResolver _conflictResolver;

  ChangesProcessor(this._db, {ConflictResolver? conflictResolver})
      : _conflictResolver = conflictResolver ?? const ConflictResolver();

  /// Gets local changes formatted as a ChangeSet
  /// Uses batch processing for better performance with large datasets
  Future<ChangeSet> getUnSyncedChanges({int batchSize = 1000}) async {
    final insertions = <String, List<Row>>{};
    final updates = <String, List<Row>>{};
    final deletions = <String, List<Row>>{};
    int lastId = 0;
    int lastVersion = 0;
    final changeIds = <int>[];

    while (true) {
      final changes = await _db.query(
        '__deltasync_changes',
        where: 'synced = 0 AND id > ?',
        whereArgs: [lastId],
        orderBy: 'id ASC',
        limit: batchSize,
      );

      if (changes.isEmpty) break;

      for (final change in changes) {
        final id = change['id'] as int;
        final tableName = change['table_name'] as String;
        final operation = change['operation'] as String;
        final version = change['version'] as int;
        final rawData =
            jsonDecode(change['data'] as String) as Map<String, dynamic>;
        final data = operation == 'DELETE'
            ? rawData['old'] as Map<String, dynamic>
            : rawData['new'] as Map<String, dynamic>;

        final row = Row(
          primaryKey: data['id'] as String,
          timestamp: data['timestamp'] as int,
          data: data,
          version: data['version'],
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
        }

        changeIds.add(id);
        lastId = id;
        lastVersion = version > lastVersion ? version : lastVersion;

        return ChangeSet(
          timestamp: DateTime.now().millisecondsSinceEpoch,
          version: changes.isEmpty ? 0 : changes.last['version'] as int,
          changeIds: changeIds,
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
    }

    return ChangeSet(
      timestamp: DateTime.now().millisecondsSinceEpoch,
      version: lastVersion,
      changeIds: changeIds,
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

  /// Marks changes as synced
  Future<void> markChangesSynced(List<int> changeIds) async {
    final batch = _db.batch();
    for (final id in changeIds) {
      batch.update(
        '__deltasync_changes',
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
      ) async {
        try {
          // Get existing row if any
          final existingRow = await txn.query(
            tableName,
            where: "id = ?",
            whereArgs: [row.primaryKey],
          );

          // Apply last-write-wins conflict resolution
          if (existingRow.isNotEmpty) {
            final existingTimestamp = existingRow.first['timestamp'] as int;
            final incomingTimestamp = row.timestamp;
            if (existingTimestamp >= incomingTimestamp) {
              // Skip this change as we already have a newer version
              return;
            }
          }

          // Store original trigger definitions before dropping
          final triggers = await txn.query(
            'sqlite_master',
            where: "type = 'trigger' AND tbl_name = ? AND name IN (?, ?, ?)",
            whereArgs: [
              tableName,
              'after_insert_$tableName',
              'after_update_$tableName',
              'after_delete_$tableName'
            ],
          );

          // Drop existing triggers
          for (final trigger in triggers) {
            final triggerName = trigger['name'] as String;
            await txn.execute('DROP TRIGGER IF EXISTS $triggerName');
          }

          // Store trigger definitions for later recreation
          final backupBatch = txn.batch();
          for (final trigger in triggers) {
            backupBatch.insert(
              '__deltasync_trigger_backup',
              {
                'table_name': tableName,
                'trigger_name': trigger['name'],
                'trigger_sql': trigger['sql'],
              },
              conflictAlgorithm: ConflictAlgorithm.replace,
            );
          }
          await backupBatch.commit();

          // Apply the change operation
          switch (operation) {
            case 'INSERT':
              try {
                await txn.insert(tableName, row.data);
              } catch (e) {
                // Handle insert conflict by attempting to update instead
                final existingRow = await txn.query(
                  tableName,
                  where: 'id = ?',
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
                    where: 'id = ?',
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
                where: 'id = ?',
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
                  where: 'id = ?',
                  whereArgs: [row.primaryKey],
                );
              } else {
                // If row doesn't exist, insert it instead
                await txn.insert(tableName, row.data);
              }
              break;
            case 'DELETE':
              // For deletes, we just attempt the operation
              // If the row doesn't exist, that's fine
              await txn.delete(
                tableName,
                where: 'id = ?',
                whereArgs: [row.primaryKey],
              );
              break;
          }
        } finally {
          // Get stored trigger definitions
          final backupTriggers = await txn.query(
            '__deltasync_trigger_backup',
            where: 'table_name = ?',
            whereArgs: [tableName],
          );

          // Recreate triggers
          for (final trigger in backupTriggers) {
            await txn.execute(trigger['trigger_sql'] as String);
          }

          // Clean up backup for this table
          await txn.delete(
            '__deltasync_trigger_backup',
            where: 'table_name = ?',
            whereArgs: [tableName],
          );
        }
      }

      // Apply all changes
      for (final entry in changeSet.insertions.changes.entries) {
        for (final row in entry.value.rows) {
          await applyTableOperation(entry.key, row, 'INSERT');
        }
      }

      for (final entry in changeSet.updates.changes.entries) {
        for (final row in entry.value.rows) {
          await applyTableOperation(entry.key, row, 'UPDATE');
        }
      }

      for (final entry in changeSet.deletions.changes.entries) {
        for (final row in entry.value.rows) {
          await applyTableOperation(entry.key, row, 'DELETE');
        }
      }

      // Mark these changes as processed only if all operations succeed
      final now = DateTime.now().toIso8601String();
      for (final log in changeLogs) {
        await txn.insert('__deltasync_processed_changes', {
          'change_log_id': log.id,
          'processed_at': now,
        });
      }
    });
  }
}
