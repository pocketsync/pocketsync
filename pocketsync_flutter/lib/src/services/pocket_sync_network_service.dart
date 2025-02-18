import 'dart:async';
import 'dart:developer';

import 'package:pocketsync_flutter/src/errors/sync_error.dart';
import 'package:pocketsync_flutter/src/models/change_log.dart';
import 'package:pocketsync_flutter/src/models/change_processing_response.dart';
import 'package:pocketsync_flutter/src/models/change_set.dart';
import 'package:pocketsync_flutter/src/services/logger_service.dart';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

class PocketSyncNetworkService {
  final Dio _dio;
  socket_io.Socket? _socket;
  final _logger = LoggerService.instance;

  final String _serverUrl;
  final String _projectId;
  final String _authToken;
  String? _userId;
  String? _deviceId;

  // Callback for handling incoming changes
  Future<void> Function(Iterable<ChangeLog>)? onChangesReceived;

  bool isSyncEnabled = false;

  PocketSyncNetworkService(
      {required String serverUrl,
      required String projectId,
      required String authToken,
      String? deviceId,
      Dio? dio})
      : _dio = dio ?? Dio(),
        _serverUrl = serverUrl,
        _projectId = projectId,
        _authToken = authToken,
        _deviceId = deviceId;

  void setUserId(String userId) {
    _logger.debug('Setting user ID: $userId');
    _userId = userId;
    _attemptReconnection();
  }

  void _attemptReconnection() {
    if (isSyncEnabled) {
      _connectWebSocket();
    }
  }

  void setDeviceId(String deviceId) {
    _logger.debug('Setting device ID: $deviceId');
    _deviceId = deviceId;
    _attemptReconnection();
  }

  void disconnect() {
    _logger.info('Disconnecting from WebSocket server');
    _socket?.disconnect();
    _socket = null;
  }

  void reconnect() {
    _logger.info('Reconnecting to WebSocket server: $isSyncEnabled');
    _connectWebSocket();
  }

  void _connectWebSocket() {
    if (_userId == null || _deviceId == null) {
      _logger
          .info('Skipping WebSocket connection: missing user ID or device ID');
      return;
    }

    if (!isSyncEnabled) {
      _logger.info('Skipping WebSocket connection: sync is disabled');
      return;
    }

    _logger.info('Connecting to WebSocket server');
    if (_socket != null || _userId == null || _deviceId == null) return;

    try {
      _socket = socket_io.io('$_serverUrl/changes', {
        'transports': ['websocket'],
        'autoConnect': true,
        'reconnection': true,
        'reconnectionDelay': 5000,
        'reconnectionAttempts': double.infinity,
        'query': {
          'project_id': _projectId,
          'user_id': _userId,
          'device_id': _deviceId,
        },
        'extraHeaders': {
          'Authorization': 'Bearer $_authToken',
        }
      });

      _socket!.onConnect((_) => log('Socket.IO connected'));

      _socket!.onDisconnect((_) => log('Socket.IO disconnected'));

      _socket!.on('changes', (data) async {
        if (onChangesReceived != null) {
          final changesData = data as Map<String, dynamic>;
          final changelogs = List.from(changesData['changes'])
              .map((raw) => ChangeLog.fromJson(raw));
          await onChangesReceived!(changelogs);
          // Acknowledge receipt of changes
          if (changesData['requiresAck'] == true) {
            _socket!.emit('acknowledge-changes', {
              'changeIds': changelogs.map((log) => log.id).toList(),
            });
          }
        }
      });

      _socket!.onError((error) {
        log('Socket.IO error: $error');
      });

      _socket!.connect();
    } catch (e) {
      throw NetworkError('WebSocket connection failed', cause: e);
    }
  }

  Future<ChangeProcessingResponse> sendChanges(ChangeSet changes) async {
    try {
      _logger.info(
          'Sending changes to server: ${changes.changeIds.length} changes');
      if (_userId == null) {
        throw InitializationError('User ID not set');
      }
      if (_deviceId == null) {
        throw InitializationError('Device ID not set');
      }

      final url = '$_serverUrl/sdk/changes';
      try {
        final response = await _dio.post(
          url,
          options: _getRequestOptions(),
          data: {
            'changeSets': [changes.toJson()],
          },
        );

        return ChangeProcessingResponse.fromJson(response.data);
      } on DioException catch (e) {
        final statusCode = e.response?.statusCode;
        final message = e.response?.statusMessage ?? 'Network request failed';
        throw NetworkError(message, statusCode: statusCode, cause: e);
      } catch (e) {
        throw NetworkError('Failed to send changes', cause: e);
      }
    } catch (e) {
      _logger.error('Error sending changes to server', error: e);
      rethrow;
    }
  }

  Options _getRequestOptions() {
    if (_userId == null) {
      throw InitializationError('User ID not set');
    }
    if (_deviceId == null) {
      throw InitializationError('Device ID not set');
    }

    return Options(
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_authToken',
        'x-project-id': _projectId,
        'x-user-id': _userId!,
        'x-device-id': _deviceId,
      },
    );
  }

  void dispose() {
    disconnect();
    _socket?.dispose();
    _socket = null;
    _dio.close();
  }
}
