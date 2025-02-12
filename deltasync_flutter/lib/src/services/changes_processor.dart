import 'dart:convert';
import 'dart:developer';
import 'package:deltasync_flutter/src/models/change_log.dart';
import 'package:sqflite/sqflite.dart';
import '../models/change_set.dart';

class ChangesProcessor {
  final Database _db;

  ChangesProcessor(this._db);

  /// Gets the last fetch date from the system device state database
  Future<DateTime?> getLastFetchDate() async {
    final result = await _db.query(
      '__deltasync_device_state',
      columns: ['last_sync_timestamp'],
      limit: 1,
    );

    if (result.isEmpty) {
      return null;
    }

    final timestamp = result.first['last_sync_timestamp'] as int?;
    if (timestamp == null) {
      return null;
    }

    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }

  /// Sets the last fetch date in the system device state database
  Future<void> setLastFetchDate(DateTime date) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final existingState = await _db.query('__deltasync_device_state', limit: 1);

    if (existingState.isNotEmpty) {
      await _db.update(
        '__deltasync_device_state',
        {
          'last_sync_timestamp': date.millisecondsSinceEpoch,
          'updated_at': now,
        },
      );
    } else {
      log('Setting last fetch date failed because state isn\'t created yet.');
    }
  }

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
    final batch = _db.batch();

    final changeSet = _computeChangeSetFromChangeLogs(changeLogs);

    void applyTableChanges(TableChanges changes, String operation) {
      changes.changes.forEach((tableName, tableRows) {
        for (final row in tableRows.rows) {
          switch (operation) {
            case 'INSERT':
              log('Inserting row: $row');
              batch.insert(tableName, row);
              break;
            case 'UPDATE':
              log('Updating row: $row');
              batch.update(
                tableName,
                row,
                where: 'id = ?',
                whereArgs: [row['id']],
              );
              break;
            case 'DELETE':
              log('Deleting row: $row');
              batch.delete(
                tableName,
                where: 'id = ?',
                whereArgs: [row['id']],
              );
              break;
          }
        }
      });
    }

    applyTableChanges(changeSet.insertions, 'INSERT');
    applyTableChanges(changeSet.updates, 'UPDATE');
    applyTableChanges(changeSet.deletions, 'DELETE');

    await batch.commit();

    await setLastFetchDate(DateTime.now());
  }
}
