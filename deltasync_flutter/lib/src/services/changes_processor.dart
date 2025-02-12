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
  Future<ChangeSet> getUnSyncedChanges() async {
    final changes = await _db.query(
      '__deltasync_changes',
      where: 'synced = 0',
      orderBy: 'version ASC',
    );

    final insertions = <String, List<Map<String, dynamic>>>{};
    final updates = <String, List<Map<String, dynamic>>>{};
    final deletions = <String, List<Map<String, dynamic>>>{};

    for (final change in changes) {
      final tableName = change['table_name'] as String;
      final operation = change['operation'] as String;
      final rawData = jsonDecode(change['data'] as String) as Map<String, dynamic>;
      final data =
          operation == 'DELETE' ? rawData['old'] as Map<String, dynamic> : rawData['new'] as Map<String, dynamic>;

      switch (operation) {
        case 'INSERT':
          insertions.putIfAbsent(tableName, () => []).add(data);
          break;
        case 'UPDATE':
          updates.putIfAbsent(tableName, () => []).add(data);
          break;
        case 'DELETE':
          deletions.putIfAbsent(tableName, () => []).add(data);
          break;
      }
    }

    final changeIds = changes.map((change) => change['id'] as int).toList();

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
    final insertions = <String, List<Map<String, dynamic>>>{};
    final updates = <String, List<Map<String, dynamic>>>{};
    final deletions = <String, List<Map<String, dynamic>>>{};

    // Process each changelog to merge changes
    for (final log in changeLogs) {
      // Merge insertions
      log.changeSet.insertions.changes.forEach((tableName, tableRows) {
        insertions.putIfAbsent(tableName, () => []).addAll(tableRows.rows);
      });

      // Merge updates
      log.changeSet.updates.changes.forEach((tableName, tableRows) {
        updates.putIfAbsent(tableName, () => []).addAll(tableRows.rows);
      });

      // Merge deletions
      log.changeSet.deletions.changes.forEach((tableName, tableRows) {
        deletions.putIfAbsent(tableName, () => []).addAll(tableRows.rows);
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
      Future<void> applyTableOperation(String tableName, Map<String, dynamic> row, String operation) async {
        try {
          // Store original trigger definitions before dropping
          final triggers = await txn.query(
            'sqlite_master',
            where: "type = 'trigger' AND tbl_name = ? AND name IN (?, ?, ?)",
            whereArgs: [tableName, 'after_insert_$tableName', 'after_update_$tableName', 'after_delete_$tableName'],
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
                await txn.insert(tableName, row);
              } catch (e) {
                // Handle insert conflict by attempting to update instead
                final existingRow = await txn.query(
                  tableName,
                  where: 'id = ?',
                  whereArgs: [row['id']],
                );
                if (existingRow.isNotEmpty) {
                  final resolvedRow = await _conflictResolver.resolveConflict(
                    tableName,
                    existingRow.first,
                    row,
                  );
                  await txn.update(
                    tableName,
                    resolvedRow,
                    where: 'id = ?',
                    whereArgs: [row['id']],
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
                whereArgs: [row['id']],
              );
              if (existingRow.isNotEmpty) {
                final resolvedRow = await _conflictResolver.resolveConflict(
                  tableName,
                  existingRow.first,
                  row,
                );
                await txn.update(
                  tableName,
                  resolvedRow,
                  where: 'id = ?',
                  whereArgs: [row['id']],
                );
              } else {
                // If row doesn't exist, insert it instead
                await txn.insert(tableName, row);
              }
              break;
            case 'DELETE':
              // For deletes, we just attempt the operation
              // If the row doesn't exist, that's fine
              await txn.delete(
                tableName,
                where: 'id = ?',
                whereArgs: [row['id']],
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
      // for (final log in changeLogs) {
      //   await txn.insert('__deltasync_processed_changes', {
      //     'change_log_id': log.id,
      //     'processed_at': now,
      //   });
      // }
    });
  }
}
