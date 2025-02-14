import 'dart:async';
import 'dart:developer';

import 'package:deltasync_flutter/src/errors/sync_error.dart';
import 'package:deltasync_flutter/src/models/change_log.dart';
import 'package:deltasync_flutter/src/models/change_processing_response.dart';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;

class DeltaSyncNetworkService {
  final Dio _dio;
  socket_io.Socket? _socket;

  final String _serverUrl;
  final String _projectId;
  final String _authToken;
  String? _userId;
  String? _deviceId;

  // Callback for handling incoming changes
  Future<void> Function(Iterable<ChangeLog>)? onChangesReceived;

  DeltaSyncNetworkService({
    required String serverUrl,
    required String projectId,
    required String authToken,
    String? deviceId,
    Dio? dio
  })  : _dio = dio ?? Dio(),
        _serverUrl = serverUrl,
        _projectId = projectId,
        _authToken = authToken,
        _deviceId = deviceId;

  void setUserId(String userId) {
    _userId = userId;
    _connectWebSocket();
  }

  void setDeviceId(String deviceId) {
    _deviceId = deviceId;
    _connectWebSocket();
  }

  /// Disconnects from the WebSocket server
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  /// Reconnects to the WebSocket server
  void reconnect() {
    if (_socket == null) {
      _connectWebSocket();
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

  Future<ChangeProcessingResponse> sendChanges(ChangeSet changes) async {
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
  }

  void _connectWebSocket() {
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

  void dispose() {
    disconnect();
    _socket?.dispose();
    _socket = null;
    _dio.close();
  }
}
