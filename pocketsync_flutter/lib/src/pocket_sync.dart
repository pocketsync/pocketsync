import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:pocketsync_flutter/src/database/database_change.dart';
import 'package:pocketsync_flutter/src/database/pocket_sync_database.dart';
import 'package:pocketsync_flutter/src/errors/sync_error.dart';
import 'package:pocketsync_flutter/src/models/change_set.dart';
import 'package:pocketsync_flutter/src/services/debouncer.dart';
import 'package:pocketsync_flutter/src/services/logger_service.dart';
import 'package:pocketsync_flutter/src/services/pocket_sync_background_service.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import 'models/pocket_sync_options.dart';
import 'models/change_processing_response.dart';
import 'services/pocket_sync_network_service.dart';
import 'services/changes_processor.dart';

class PocketSync {
  static final PocketSync instance = PocketSync._internal();
  PocketSync._internal();

  final _logger = LoggerService.instance;

  late PocketSyncDatabase _database;
  String? _userId;

  late PocketSyncNetworkService _networkService;
  late ChangesProcessor _changesProcessor;
  bool _isSyncing = false;
  bool _isInitialized = false;
  bool _isPaused = false;
  bool _isManuallyPaused = false;
  bool _isSyncStarted = false;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  final Debouncer _debouncer = Debouncer();

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

    // First create database
    _database = PocketSyncDatabase(
      options: databaseOptions,
    );
    final db = await _database.initialize(dbPath: dbPath);

    // Get or create device ID
    final deviceId = await _fetchOrCreateDeviceId(db);

    // Initialize network service
    _networkService = PocketSyncNetworkService(
      serverUrl: options.serverUrl,
      projectId: options.projectId,
      authToken: options.authToken,
      deviceId: deviceId,
    );

    // Initialize background service
    final backgroundService = PocketSyncBackgroundService();
    await backgroundService.initialize(
      dbPath: dbPath,
      dbVersion: databaseOptions.version,
      serverUrl: options.serverUrl,
      projectId: options.projectId,
      authToken: options.authToken,
      deviceId: deviceId,
    );

    // Connect background service to database
    _database.setBackgroundService(backgroundService);

    _changesProcessor = ChangesProcessor(
      _database.db!,
      conflictResolver: options.conflictResolver,
    );

    _networkService.onChangesReceived = _changesProcessor.applyRemoteChanges;

    // Set up real-time change notification
    _database.addGlobalListener(_syncChanges);

    // Initialize connectivity monitoring
    _setupConnectivityMonitoring();
    _isInitialized = true;
  }

  Future<String> _fetchOrCreateDeviceId(Database db) async {
    final deviceState = await db.query('__pocketsync_device_state', limit: 1);
    if (deviceState.isNotEmpty) {
      return deviceState.first['device_id'] as String;
    } else {
      final deviceId = Uuid().v4();
      await db.insert(
        '__pocketsync_device_state',
        {'device_id': deviceId},
      );
      return deviceId;
    }
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
      _isPaused = true;
      _networkService.disconnect();
    } else if (!_isManuallyPaused) {
      _isPaused = false;
      _networkService.reconnect();
      await _sync();
    }
  }

  /// Sets the user ID for synchronization
  /// [userId] - User ID
  /// This method should be called before [startSync].
  /// Throws [StateError] if PocketSync is not initialized
  Future<void> setUserId({required String userId}) async {
    _runGuarded(() {
      _userId = userId;
      _networkService.setUserId(userId);
    });
  }

  /// Starts the synchronization process
  ///
  /// Throws [StateError] if user ID is not set
  /// Throws [StateError] if PocketSync is not initialized
  Future<void> startSync() async {
    await _runGuarded(() async {
      if (_userId == null) throw StateError('User ID not set');
      _isPaused = false;
      _isManuallyPaused = false;
      _isSyncStarted = true;
      _networkService.isSyncEnabled = true;

      await _sync();
    });
  }

  void _syncChanges(PsDatabaseChange changes) => _sync();

  /// Internal sync method
  Future<void> _sync() async {
    if (_isSyncing ||
        _userId == null ||
        _isPaused ||
        _isManuallyPaused ||
        !_isSyncStarted) {
      _logger.debug(
          'Sync skipped: already in progress, user ID not set, sync is paused, or sync not started');
      return;
    }
    _isSyncing = true;

    _debouncer.run(() async {
      try {
        final changeSet = await _changesProcessor.getUnSyncedChanges();
        if (changeSet.insertions.changes.isNotEmpty ||
            changeSet.updates.changes.isNotEmpty ||
            changeSet.deletions.changes.isNotEmpty) {
          _logger.info(
              'Processing changes: ${changeSet.changeIds.length} changes found');
          final processedResponse = await _sendChanges(changeSet);

          if (processedResponse.status == 'success' &&
              processedResponse.processed) {
            await _markChangesSynced(changeSet.changeIds);
            _logger.info('Changes successfully synced');
          }
        }
      } on SyncError catch (e) {
        _logger.error('Sync error occurred', error: e);
      } finally {
        _isSyncing = false;
      }
    });
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
      _isPaused = true;
      _isManuallyPaused = true;
      _networkService.isSyncEnabled = false;
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
      _isPaused = false;
      _isManuallyPaused = false;
      _networkService.isSyncEnabled = true;
      _networkService.reconnect();
      _logger.info('Sync resumed');
      await _sync();
    });
  }

  /// Returns whether sync is currently paused
  bool get isPaused => _runGuarded(() => _isPaused);

  /// Cleans up resources
  Future<void> dispose() async {
    await _connectivitySubscription?.cancel();
    await _database.close();
    _networkService.dispose();
  }
}
