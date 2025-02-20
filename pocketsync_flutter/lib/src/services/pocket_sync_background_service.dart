import 'dart:async';

import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/models/change_log.dart';
import 'package:pocketsync_flutter/src/models/change_set.dart';
import 'package:pocketsync_flutter/src/services/changes_processor.dart';
import 'package:pocketsync_flutter/src/services/logger_service.dart';
import 'package:pocketsync_flutter/src/services/pocket_sync_network_service.dart';
import 'package:pocketsync_flutter/src/utils/sync_performance_monitor.dart';
import 'package:sqflite/sqflite.dart';

import '../database/pocket_sync_schema.dart';

/// Background service for handling PocketSync database synchronization
class PocketSyncBackgroundService {
  static const String _syncRequestAction = 'syncNow';
  static const String _onRemoteChangeAction = 'onRemoteChange';

  static final LoggerService _logger = LoggerService.instance;

  final FlutterBackgroundService _service;

  bool _isInitialized = false;

  PocketSyncBackgroundService() : _service = FlutterBackgroundService();

  /// Get the underlying background service instance
  FlutterBackgroundService get service => _service;

  /// Get performance metrics for the background service
  Map<String, String> getPerformanceMetrics() {
    return SyncPerformanceMonitor().getPerformanceReport();
  }

  /// Initialize the background service
  Future<void> initialize({
    required String dbPath,
    required int dbVersion,
    required String serverUrl,
    required String projectId,
    required String authToken,
    required String deviceId,
    required ConflictResolver conflictResolver,
  }) async {
    if (_isInitialized) return;

    // Configure and start the service
    await _service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: _backgroundServiceMain,
        autoStart: true,
        isForegroundMode: true,
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: true,
        onForeground: _backgroundServiceMain,
        onBackground: _onIosBackground,
      ),
    );

    await _service.startService();

    // Send initialization data
    _service.invoke(_initAction, {
      'dbPath': dbPath,
      'dbVersion': dbVersion,
      'serverUrl': serverUrl,
      'projectId': projectId,
      'authToken': authToken,
      'deviceId': deviceId,
      'conflictResolver': conflictResolver,
    });

    _isInitialized = true;
  }

  /// iOS background handler - required by flutter_background_service
  @pragma('vm:entry-point')
  static bool _onIosBackground(ServiceInstance service) {
    return true;
  }

  /// Main background service entry point
  @pragma('vm:entry-point')
  static const String _initAction = 'initialize';

  static void _backgroundServiceMain(ServiceInstance service) async {
    Database? db;
    PocketSyncNetworkService? networkService;
    ChangesProcessor? processor;
    ConflictResolver? conflictResolver;
    bool isInitialized = false;

    /// Notifies the main app about database changes
    void notifyDatabaseChange(
      String tableName,
      String operation,
      Map<String, dynamic> data,
      String recordId,
      int timestamp,
    ) {
      // Send simple change notification to main isolate
      service.invoke('onDatabaseChange', {
        'tableName': tableName,
        'operation': operation,
        'data': data,
        'recordId': recordId,
        'timestamp': timestamp,
      });
    }

    /// Apply a table operation with conflict resolution
    Future<void> applyTableOperation(
      String tableName,
      Row row,
      String operation,
      Transaction txn,
      ConflictResolver? conflictResolver,
    ) async {
      try {
        // Disable all triggers temporarily
        await txn.execute('PRAGMA recursive_triggers = OFF;');

        try {
          // Apply the change operation
          switch (operation) {
            case 'INSERT':
              try {
                await txn.insert(tableName, row.data);
                notifyDatabaseChange(
                  tableName,
                  'INSERT',
                  row.data,
                  row.primaryKey,
                  row.timestamp,
                );
              } catch (e) {
                // Handle insert conflict by attempting to update instead
                final existingRow = await txn.query(
                  tableName,
                  where: 'ps_global_id = ?',
                  whereArgs: [row.primaryKey],
                );

                if (existingRow.isNotEmpty) {
                  // Resolve conflict
                  final resolvedRow = await conflictResolver?.resolveConflict(
                          tableName, row.data, existingRow.first) ??
                      row.data;

                  // Update with resolved data
                  await txn.update(
                    tableName,
                    resolvedRow,
                    where: 'ps_global_id = ?',
                    whereArgs: [row.primaryKey],
                  );
                  notifyDatabaseChange(
                    tableName,
                    'UPDATE',
                    resolvedRow,
                    row.primaryKey,
                    row.timestamp,
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
                // Resolve conflict
                final resolvedRow = await conflictResolver?.resolveConflict(
                        tableName, row.data, existingRow.first) ??
                    row.data;

                // Update with resolved data
                await txn.update(
                  tableName,
                  resolvedRow,
                  where: 'ps_global_id = ?',
                  whereArgs: [row.primaryKey],
                );
                notifyDatabaseChange(
                  tableName,
                  'UPDATE',
                  resolvedRow,
                  row.primaryKey,
                  row.timestamp,
                );
              }
              break;

            case 'DELETE':
              await txn.delete(
                tableName,
                where: 'ps_global_id = ?',
                whereArgs: [row.primaryKey],
              );
              notifyDatabaseChange(
                tableName,
                'DELETE',
                row.data,
                row.primaryKey,
                row.timestamp,
              );
              break;
          }
        } finally {
          await txn.execute('PRAGMA recursive_triggers = ON;');
        }
      } catch (e) {
        rethrow;
      }
    }

    /// Internal method to apply changes to the database
    Future<void> applyChanges(Database db, ChangeSet changeSet,
        Iterable<ChangeLog> changeLogs) async {
      final affectedTables = <String>{};
      await db.transaction((txn) async {
        // Apply all changes
        for (final entry in changeSet.insertions.changes.entries) {
          for (final row in entry.value.rows) {
            await applyTableOperation(
              entry.key,
              row,
              'INSERT',
              txn,
              conflictResolver,
            );
          }
        }

        for (final entry in changeSet.updates.changes.entries) {
          for (final row in entry.value.rows) {
            await applyTableOperation(
              entry.key,
              row,
              'UPDATE',
              txn,
              conflictResolver,
            );
          }
        }

        for (final entry in changeSet.deletions.changes.entries) {
          for (final row in entry.value.rows) {
            await applyTableOperation(
              entry.key,
              row,
              'DELETE',
              txn,
              conflictResolver,
            );
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

        // Collect affected tables
        affectedTables.addAll(changeSet.insertions.changes.keys);
        affectedTables.addAll(changeSet.updates.changes.keys);
        affectedTables.addAll(changeSet.deletions.changes.keys);
      });
    }

    // Listen for initialization
    service.on(_initAction).listen((event) async {
      if (event == null) return;
      final config = event;

      try {
        // Close existing connection if any
        await db?.close();

        // Initialize direct database connection
        db = await openDatabase(
          config['dbPath'] as String,
          version: config['dbVersion'] as int,
          onCreate: (db, version) async {
            await PocketSyncSchema.createTables(db, version);
          },
        );

        // Initialize network service
        networkService = PocketSyncNetworkService(
          serverUrl: config['serverUrl'] as String,
          projectId: config['projectId'] as String,
          authToken: config['authToken'] as String,
          deviceId: config['deviceId'] as String,
        );

        // Initialize conflict resolver
        conflictResolver = config['conflictResolver'] as ConflictResolver;

        processor = ChangesProcessor(db!);
        isInitialized = true;

        // Setup WebSocket listeners only after initialization
        networkService!.onChangesReceived = (changes) async {
          if (!isInitialized || processor == null) return;

          int retryCount = 0;
          const maxRetries = 3;
          const retryDelay = Duration(seconds: 5);

          while (retryCount < maxRetries) {
            try {
              final changeSet =
                  processor!.computeChangeSetFromChangeLogs(changes);
              await applyChanges(db!, changeSet, changes);

              // Notify main isolate of applied changes
              service.invoke(
                _onRemoteChangeAction,
                {
                  'changes': changes.map((c) => c.toJson()).toList(),
                },
              );
              break;
            } catch (e) {
              retryCount++;
              _logger.error(
                  'Error applying remote changes (attempt $retryCount/$maxRetries): $e');

              if (retryCount >= maxRetries) {
                _logger.error(
                    'Failed to apply remote changes after $maxRetries attempts');
                break;
              }

              await Future.delayed(retryDelay * retryCount);
            }
          }
        };
      } catch (e) {
        _logger.error('Error during initialization: $e');
        isInitialized = false;
      }
    });

    // Listen for sync requests from main isolate
    service.on(_syncRequestAction).listen((event) async {
      if (!isInitialized ||
          event == null ||
          processor == null ||
          networkService == null) {
        return;
      }

      try {
        // Extract changes from the event
        final changeSetJson = event['changeSet'] as Map<String, dynamic>;
        final changes = ChangeSet.fromJson(changeSetJson);
        if (changes.isEmpty) return;

        // Send changes to server with retry logic
        int retryCount = 0;
        const maxRetries = 3;
        const retryDelay = Duration(seconds: 5);

        while (retryCount < maxRetries) {
          try {
            await networkService!.sendChanges(changes);
            // Mark changes as synced after successful sync
            await processor!.markChangesSynced(changes.changeIds);
            break;
          } catch (e) {
            retryCount++;
            _logger.error(
                'Error sending changes (attempt $retryCount/$maxRetries): $e');

            if (retryCount >= maxRetries) {
              throw SyncStateError(
                  'Failed to send changes after $maxRetries attempts');
            }

            await Future.delayed(retryDelay * retryCount);
          }
        }
      } catch (e) {
        _logger.error('Error processing sync request: $e');
      }
    });

    // Listen for service stop
    service.on('stopService').listen((event) async {
      await db?.close();
      isInitialized = false;
      db = null;
      networkService = null;
      processor = null;
    });
  }

  /// Request an immediate sync operation
  Future<void> requestSync() async {
    _service.invoke(_syncRequestAction);
  }

  /// Stop the background service
  Future<void> stop() async {
    _service.invoke('stopService');
  }
}
