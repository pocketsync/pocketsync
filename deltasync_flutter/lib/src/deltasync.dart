import 'dart:async';
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
  Timer? _syncTimer;
  String? _userId;

  late DeltaSyncNetworkService _networkService;
  late ChangesProcessor _changesProcessor;
  bool _isSyncing = false;
  bool _isInitialized = false;
  Duration? _syncInterval;

  /// Returns the database instance
  /// Throws [StateError] if DeltaSync is not initialized
  DeltaSyncDatabase get database {
    if (!_isInitialized) {
      throw StateError(
        'DeltaSync must be initialized before accessing the database',
      );
    }
    return _database;
  }

  /// Initializes DeltaSync with the given configuration
  Future<void> initialize({
    required String dbPath,
    required Duration syncInterval,
    required DeltaSyncOptions options,
    Future<void> Function(Database db)? onCreate,
  }) async {
    _syncInterval = syncInterval;

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

    _changesProcessor = ChangesProcessor(db);
    _isInitialized = true;
  }

  /// Sets the user ID for synchronization
  Future<void> setUserId({required String userId}) async {
    _userId = userId;
    _networkService.setUserId(userId);
  }

  /// Starts the synchronization process
  Future<void> startSync() async {
    if (_syncTimer != null) return;
    if (_syncInterval == null) throw Exception('Sync interval not set');
    if (_userId == null) throw Exception('User ID not set');

    // Start periodic sync
    _syncTimer = Timer.periodic(_syncInterval!, (_) => _sync());
    // Perform initial sync
    await _sync();
  }

  /// Pauses the synchronization process
  Future<void> pauseSync() async {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  /// Resumes the synchronization process
  Future<void> resumeSync() async {
    await startSync();
  }

  /// Internal sync method
  Future<void> _sync() async {
    if (_isSyncing || _userId == null) return;
    _isSyncing = true;

    try {
      await _fetchAndApplyRemoteChanges();

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
    } catch (e) {
      print('Sync error: $e');
    } finally {
      _isSyncing = false;
    }
  }

  /// Sends changes to the server
  Future<ChangeProcessingResponse> _sendChanges(ChangeSet changes) async {
    return await _networkService.sendChanges(changes);
  }

  /// Marks changes as synced
  Future<void> _markChangesSynced(List<int> changeIds) async {
    await _changesProcessor.markChangesSynced(changeIds);
  }

  /// Fetches and applies remote changes
  Future<void> _fetchAndApplyRemoteChanges() async {
    try {
      final lastFetchedAt = await _changesProcessor.getLastFetchDate();
      final remoteChanges = await _networkService.fetchRemoteChanges(
        lastFetchedAt: lastFetchedAt,
      );
      await _changesProcessor.applyRemoteChanges(remoteChanges);
    } catch (e) {
      // TODO: handle error
    }
  }

  /// Cleans up resources
  Future<void> dispose() async {
    await pauseSync();
    await _database.close();
    _networkService.dispose();
  }
}
