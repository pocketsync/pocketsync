import 'dart:async';
import 'package:deltasync_flutter/src/errors/sync_error.dart';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:sqflite/sqflite.dart';
import 'models/delta_sync_options.dart';
import 'models/change_processing_response.dart';
import 'services/delta_sync_network_service.dart';
import 'services/changes_processor.dart';
import 'services/delta_sync_database.dart';

class DeltaSync {
  static final DeltaSync instance = DeltaSync._internal();
  DeltaSync._internal();

  late DeltaSyncDatabase _database;
  String? _userId;

  late DeltaSyncNetworkService _networkService;
  late ChangesProcessor _changesProcessor;
  bool _isSyncing = false;
  bool _isInitialized = false;

  /// Returns the database instance
  /// Throws [StateError] if DeltaSync is not initialized
  DeltaSyncDatabase get database => _runGuarded(() => _database);

  T _runGuarded<T>(T Function() callaback) {
    if (!_isInitialized) {
      throw StateError(
        'You should call DeltaSync.instance.initialize before any other call.',
      );
    }

    return callaback();
  }

  /// Initializes DeltaSync with the given configuration
  Future<void> initialize({
    required String dbPath,
    required DeltaSyncOptions options,
    Future<void> Function(Database db)? onCreate,
  }) async {
    if (_isInitialized) return;

    _networkService = DeltaSyncNetworkService(
      serverUrl: options.serverUrl,
      projectId: options.projectId,
      projectApiKey: options.projectApiKey,
    );

    _database = DeltaSyncDatabase();
    final db = await _database.initialize(
      dbPath: dbPath,
      onCreate: onCreate,
    );

    // Set device ID in network service
    final deviceState = await db.query('__deltasync_device_state', limit: 1);
    if (deviceState.isNotEmpty) {
      final deviceId = deviceState.first['device_id'] as String;
      _networkService.setDeviceId(deviceId);
    }

    _changesProcessor = ChangesProcessor(
      _database,
      conflictResolver: options.conflictResolver,
    );

    _networkService.onChangesReceived = _changesProcessor.applyRemoteChanges;
    _isInitialized = true;
  }

  /// Sets the user ID for synchronization
  Future<void> setUserId({required String userId}) async {
    _runGuarded(() {
      _userId = userId;
      _networkService.setUserId(userId);
    });
  }

  /// Starts the synchronization process
  Future<void> startSync() async {
    if (_userId == null) throw Exception('User ID not set');

    // Perform initial sync
    await _sync();
  }

  /// Internal sync method
  Future<void> _sync() async {
    if (_isSyncing || _userId == null) return;
    _isSyncing = true;

    try {
      final changeSet = await _changesProcessor.getUnSyncedChanges();
      if (changeSet.insertions.changes.isNotEmpty ||
          changeSet.updates.changes.isNotEmpty ||
          changeSet.deletions.changes.isNotEmpty) {
        final processedResponse = await _sendChanges(changeSet);

        if (processedResponse.status == 'success' &&
            processedResponse.processed) {
          await _markChangesSynced(changeSet.changeIds);
        }
      }
    } on Exception catch (e) {
      throw SyncError('Sync failed: $e', innerError: e);
    } finally {
      _isSyncing = false;
    }
  }

  /// Sends changes to the server
  Future<ChangeProcessingResponse> _sendChanges(ChangeSet changes) async =>
      await _networkService.sendChanges(changes);

  /// Marks changes as synced
  Future<void> _markChangesSynced(List<int> changeIds) async =>
      await _changesProcessor.markChangesSynced(changeIds);

  /// Cleans up resources
  Future<void> dispose() async {
    await _database.close();
    _networkService.dispose();
  }
}
