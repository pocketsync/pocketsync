import 'dart:convert';
import 'dart:developer';

import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/models/change_log.dart';
import 'package:pocketsync_flutter/src/models/change_set.dart';
import 'package:pocketsync_flutter/src/services/logger_service.dart';
import 'package:sqflite/sqflite.dart';

class ChangesProcessor {
  final Database _db;

  final _logger = LoggerService.instance;
  final FlutterBackgroundService _backgroundService;
  static const int _maxRetries = 3;
  static const Duration _retryDelay = Duration(seconds: 5);

  ChangesProcessor(this._db, {FlutterBackgroundService? backgroundService})
      : _backgroundService = backgroundService ?? FlutterBackgroundService();

  /// Gets local changes formatted as a ChangeSet and forwards them to the background service
  /// Uses batch processing for better performance with large datasets
  Future<void> processUnSyncedChanges({int batchSize = 1000}) async {
    int retryCount = 0;
    while (retryCount < _maxRetries) {
      try {
        final changeSet = await _getUnSyncedChanges(batchSize: batchSize);
        _logger.info('Forwarding local changes to background service');

        // Forward changes to background service
        _backgroundService.invoke('syncNow', {
          'changeSet': changeSet.toJson(),
        });
        return;
      } catch (e) {
        retryCount++;
        _logger.error(
          'Error processing local changes (attempt $retryCount/$_maxRetries)',
          error: e,
        );

        if (retryCount < _maxRetries) {
          await Future.delayed(_retryDelay * retryCount);
          continue;
        }

        throw SyncStateError(
            'Failed to process local changes after $_maxRetries attempts: ${e.toString()}');
      }
    }
  }

  /// Internal method to get unsynced changes
  Future<ChangeSet> _getUnSyncedChanges({int batchSize = 1000}) async {
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

  ChangeSet computeChangeSetFromChangeLogs(Iterable<ChangeLog> changeLogs) {
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

    int retryCount = 0;
    while (retryCount < _maxRetries) {
      try {
        _logger.info('Forwarding remote changes to background service');

        // Forward changes to background service
        _backgroundService.invoke('onRemoteChange', {
          'changeLogs': changeLogs.map((log) => log.toJson()).toList(),
        });
        return;
      } catch (e) {
        retryCount++;
        _logger.error(
          'Error forwarding remote changes (attempt $retryCount/$_maxRetries)',
          error: e,
        );

        if (retryCount < _maxRetries) {
          await Future.delayed(_retryDelay * retryCount);
          continue;
        }

        throw SyncStateError(
            'Failed to forward remote changes after $_maxRetries attempts: ${e.toString()}');
      }
    }
  }
}
