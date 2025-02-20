import 'dart:async';

import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/services/changes_processor.dart';
import 'package:pocketsync_flutter/src/services/pocket_sync_network_service.dart';
import 'package:sqflite/sqflite.dart';

import '../database/pocket_sync_schema.dart';

/// Background service for handling PocketSync database synchronization
class PocketSyncBackgroundService {
  static const String _syncRequestAction = 'syncNow';
  static const String _onRemoteChangeAction = 'onRemoteChange';

  final FlutterBackgroundService _service;

  bool _isInitialized = false;

  PocketSyncBackgroundService() : _service = FlutterBackgroundService();

  /// Initialize the background service
  Future<void> initialize({
    required String dbPath,
    required int dbVersion,
    required String serverUrl,
    required String projectId,
    required String authToken,
    required String deviceId,
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
    bool isInitialized = false;

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

        processor = ChangesProcessor(db!);
        isInitialized = true;

        // Setup WebSocket listeners only after initialization
        networkService!.onChangesReceived = (changes) async {
          if (!isInitialized || processor == null) return;

          try {
            await processor!.applyRemoteChanges(changes);

            // Notify main isolate of applied changes
            service.invoke(
              _onRemoteChangeAction,
              {
                'changes': changes.map((c) => c.toJson()).toList(),
              },
            );
          } catch (e) {
            print('Error applying remote changes: $e');
          }
        };
      } catch (e) {
        print('Error during initialization: $e');
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
        final changes = await processor!.getUnSyncedChanges();
        if (changes.isEmpty) return;

        // Send changes to server
        await networkService!.sendChanges(changes);
      } catch (e) {
        print('Error processing sync request: $e');
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
