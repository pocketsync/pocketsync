import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import '../models/change_set.dart';

class ChangesProcessor {
  final Database _db;

  ChangesProcessor(this._db);

  /// Gets local changes formatted as a ChangeSet
  Future<ChangeSet> getLocalChanges() async {
    final changes = await _db.query(
      '_deltasync_changes',
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

    return ChangeSet(
      timestamp: DateTime.now().millisecondsSinceEpoch,
      version: changes.isEmpty ? 0 : changes.last['version'] as int,
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
  Future<void> markChangesSynced(List<Map<String, dynamic>> changes) async {
    final batch = _db.batch();
    for (final change in changes) {
      batch.update(
        '_deltasync_changes',
        {'synced': 1},
        where: 'id = ?',
        whereArgs: [change['id']],
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
  }
}