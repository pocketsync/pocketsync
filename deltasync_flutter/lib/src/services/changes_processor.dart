import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import '../models/change_set.dart';

class ChangesProcessor {
  final Database _db;

  ChangesProcessor(this._db);

  /// Gets the last fetch date from the system device state database
  Future<DateTime?> getLastFetchDate() async {
    final result = await _db.query(
      '__deltasync_state',
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
    await _db.insert(
      '__deltasync_state',
      {'last_sync_timestamp': date.millisecondsSinceEpoch},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
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
      final data = jsonDecode(change['data'] as String) as Map<String, dynamic>;

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

  /// Applies remote changes to local database
  Future<void> applyRemoteChanges(ChangeSet changeSet) async {
    final batch = _db.batch();

    void applyTableChanges(TableChanges changes, String operation) {
      changes.changes.forEach((tableName, tableRows) {
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
      });
    }

    applyTableChanges(changeSet.insertions, 'INSERT');
    applyTableChanges(changeSet.updates, 'UPDATE');
    applyTableChanges(changeSet.deletions, 'DELETE');

    await batch.commit();

    await setLastFetchDate(DateTime.now());
  }
}
