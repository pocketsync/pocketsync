import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:pocketsync_flutter/src/database/database_change.dart';
import 'package:pocketsync_flutter/src/database/pocket_sync_database.dart';
import 'package:pocketsync_flutter/src/models/change_set.dart';
import 'package:pocketsync_flutter/src/services/logger_service.dart';
import 'models/pocket_sync_options.dart';
import 'models/change_processing_response.dart';
import 'services/pocket_sync_network_service.dart';
import 'services/changes_processor.dart';
import 'services/sync_task_queue.dart';

class PocketSync {
  static final PocketSync instance = PocketSync._internal();
  PocketSync._internal();

  final _logger = LoggerService.instance;

  late PocketSyncDatabase _database;
  String? _userId;

  late PocketSyncNetworkService _networkService;
  late ChangesProcessor _changesProcessor;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  late final SyncTaskQueue _syncQueue;

  bool _isInitialized = false;
  bool _isSyncing = false;
  bool _isConnected = true;
  bool _isManuallyPaused = false;

  /// Returns the database instance
  /// Throws [StateError] if PocketSync is not initialized
  PocketSyncDatabase get database => _runGuarded(() => _database);

  T _runGuarded<T>(T Function() callback) {
    if (!_isInitialized) {
      throw StateError(
        'You should call PocketSync.instance.initialize before any other call.',
      );
    }
    return callback();
  }

  /// Initializes PocketSync with the given configuration
  /// [dbPath] - Path to the local database file
  /// [options] - PocketSync configuration options
  /// [databaseOptions] - Database configuration options
  ///
  /// Throws [StateError] if PocketSync is already initialized
  Future<void> initialize({
    required String dbPath,
    required PocketSyncOptions options,
    required DatabaseOptions databaseOptions,
  }) async {
    if (_isInitialized) return;

    _networkService = PocketSyncNetworkService(
      serverUrl: options.serverUrl ?? 'https://api.pocketsync.dev',
      projectId: options.projectId,
      authToken: options.authToken,
    );

    _syncQueue = SyncTaskQueue(
      processChanges: _processChanges,
      debounceDuration: const Duration(milliseconds: 500),
    );

    _database = PocketSyncDatabase();
    final db = await _database.initialize(
      dbPath: dbPath,
      options: databaseOptions,
    );

    // Set device ID in network service
    final deviceState = await db.query('__pocketsync_device_state', limit: 1);
    if (deviceState.isNotEmpty) {
      final deviceId = deviceState.first['device_id'] as String;
      _networkService.setDeviceId(deviceId);
    }

    _changesProcessor = ChangesProcessor(
      _database,
      conflictResolver: options.conflictResolver,
    );

    _networkService.onChangesReceived = _changesProcessor.applyRemoteChanges;

    // Set up real-time change notification
    _database.addGlobalListener(_syncChanges);

    // Initialize connectivity monitoring
    _setupConnectivityMonitoring();
    _isInitialized = true;
  }

  /// Sets up connectivity monitoring
  void _setupConnectivityMonitoring() {
    _connectivitySubscription =
        Connectivity().onConnectivityChanged.listen(_handleConnectivityChange);
  }

  /// Handles connectivity changes
  Future<void> _handleConnectivityChange(
    List<ConnectivityResult> result,
  ) async {
    if (result.contains(ConnectivityResult.none) || result.isEmpty) {
      _isConnected = false;
      _networkService.disconnect();
    } else if (!_isConnected) {
      _isConnected = true;
      _networkService.reconnect();
      await _sync();
    }
  }

  /// Sets the user ID for synchronization
  /// [userId] - User ID
  /// This method should be called before [startSync].
  /// Throws [StateError] if PocketSync is not initialized
  Future<void> setUserId({required String userId}) async {
    await _runGuarded(() async {
      _userId = userId;
      _networkService.setUserId(userId);
      await startSync();
    });
  }

  /// Starts the synchronization process
  ///
  /// Throws [StateError] if user ID is not set
  /// Throws [StateError] if PocketSync is not initialized
  Future<void> startSync() async {
    await _runGuarded(() async {
      if (_userId == null) throw StateError('User ID not set');
      if (_isManuallyPaused) return;
      await _sync();
    });
  }

  void _syncChanges(PsDatabaseChange changes) {
    if (!_isSyncing && _isConnected && !_isManuallyPaused) {
      scheduleMicrotask(() => _sync());
    } else {
      _logger.debug('Skipping syncChanges: inappropriate state');
    }
  }

  /// Internal sync method
  Future<void> _sync() async {
    if (_userId == null || _isSyncing || !_isConnected || _isManuallyPaused) {
      _logger.debug(
          'Sync skipped: user ID not set or inappropriate state');
      return;
    }

    _isSyncing = true;

    try {
      // Fetch changes in a non-blocking way
      final changeSet =
          await Future(() => _changesProcessor.getUnSyncedChanges());

      if (changeSet.insertions.changes.isNotEmpty ||
          changeSet.updates.changes.isNotEmpty ||
          changeSet.deletions.changes.isNotEmpty) {
        _logger.info(
            'Queueing changes: ${changeSet.changeIds.length} changes found');

        // Queue the changes for processing
        await _syncQueue.enqueue(changeSet);
      }
      _isSyncing = false;
    } catch (e) {
      _logger.error('Error during sync', error: e);
      _isSyncing = false;
      rethrow;
    }
  }

  /// Processes a batch of changes
  Future<void> _processChanges(ChangeSet changeSet) async {
    try {
      _logger.info('Processing batch: ${changeSet.changeIds.length} changes');

      // Send changes asynchronously
      final processedResponse = await Future(() => _sendChanges(changeSet));

      if (processedResponse.status == 'success' &&
          processedResponse.processed) {
        // Mark changes as synced in a non-blocking way
        await Future(() => _markChangesSynced(changeSet.changeIds));
        _logger.info('Changes successfully synced');
      }
    } catch (e) {
      _logger.error('Error processing changes', error: e);
      rethrow;
    }
  }

  /// Sends changes to the server
  Future<ChangeProcessingResponse> _sendChanges(ChangeSet changes) async =>
      await _networkService.sendChanges(changes);

  /// Marks changes as synced
  Future<void> _markChangesSynced(List<int> changeIds) async =>
      await _changesProcessor.markChangesSynced(changeIds);

  /// Pauses the synchronization process
  /// This method can be called to pause the synchronization process
  ///
  /// Throws [StateError] if PocketSync is not initialized
  void pauseSync() {
    _runGuarded(() {
      _isManuallyPaused = true;
      _networkService.disconnect();
      _logger.info('Sync manually paused');
    });
  }

  /// Resumes the synchronization process
  /// This method can be called to resume the synchronization process
  ///
  /// Throws [StateError] if PocketSync is not initialized
  Future<void> resumeSync() async {
    _runGuarded(() async {
      if (_isManuallyPaused) {
        _isManuallyPaused = false;
        _networkService.reconnect();
        _logger.info('Sync resumed');
        await _sync();
      }
    });
  }

  /// Returns whether sync is currently paused
  bool get isPaused => _runGuarded(() =>
      !_isConnected || _isManuallyPaused);

  /// Cleans up resources
  Future<void> dispose() async {
    await _connectivitySubscription?.cancel();
    await _database.close();
    _networkService.disconnect();
    _syncQueue.dispose();
  }
}
