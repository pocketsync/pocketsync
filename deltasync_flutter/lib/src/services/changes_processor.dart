import 'dart:convert';
import 'dart:developer';
import 'package:deltasync_flutter/deltasync_flutter.dart';
import 'package:deltasync_flutter/src/models/change_log.dart';
import '../models/change_set.dart';

class ChangesProcessor {
  final DeltaSyncDatabase _db;

  ChangesProcessor(this._db);

  /// Gets local changes formatted as a ChangeSet
  Future<ChangeSet> getUnSyncedChanges() async {
    final changes = await _db.query(
      '__deltasync_changes',
      where: 'synced = 0 AND source = "local"',
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

  ChangeSet _computeChangeSetFromChangeLogs(List<ChangeLog> changeLogs) {
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
  Future<void> applyRemoteChanges(List<ChangeLog> changeLogs) async {
    if (changeLogs.isEmpty) return;

    final batch = _db.batch();
    final changeSet = _computeChangeSetFromChangeLogs(changeLogs);

    // Track which changes we're about to process
    final now = DateTime.now().millisecondsSinceEpoch;

    void applyTableChanges(TableChanges changes, String operation) async {
      for (final entry in changes.changes.entries) {
        final tableName = entry.key;
        final tableRows = entry.value;

        // Disable triggers before applying changes
        await _db.disableTriggers(tableName);

        try {
          for (final row in tableRows.rows) {
            switch (operation) {
              case 'INSERT':
                batch.insert(tableName, row);
                break;
              case 'UPDATE':
                batch.update(
                  tableName,
                  row,
                  where: 'id = ?',
                  whereArgs: [row['id']],
                );
                break;
              case 'DELETE':
                batch.delete(
                  tableName,
                  where: 'id = ?',
                  whereArgs: [row['id']],
                );
                break;
            }
          }
        } finally {
          await _db.enableTriggers(tableName);
        }
      }
    }

    // Apply all changes
    applyTableChanges(changeSet.insertions, 'INSERT');
    applyTableChanges(changeSet.updates, 'UPDATE');
    applyTableChanges(changeSet.deletions, 'DELETE');

    // Mark these changes as processed
    for (final log in changeLogs) {
      batch.insert('__deltasync_processed_changes', {
        'change_log_id': log.id,
        'processed_at': now,
      });
    }

    await batch.commit();
  }
}
