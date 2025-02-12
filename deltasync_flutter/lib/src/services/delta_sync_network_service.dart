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
  final String _projectApiKey;
  String? _userId;
  String? _deviceId;

  // Callback for handling incoming changes
  Future<void> Function(Iterable<ChangeLog>)? onChangesReceived;

  DeltaSyncNetworkService({
    required String serverUrl,
    required String projectId,
    required String projectApiKey,
    String? deviceId,
  })  : _dio = Dio(),
        _serverUrl = serverUrl,
        _projectId = projectId,
        _projectApiKey = projectApiKey,
        _deviceId = deviceId;

  void setUserId(String userId) {
    _userId = userId;
    _connectWebSocket();
  }

  void setDeviceId(String deviceId) {
    _deviceId = deviceId;
    _connectWebSocket();
  }

  Options _getRequestOptions() {
    if (_userId == null) {
      throw SyncError('User ID not set');
    }

    if (_deviceId == null) {
      throw SyncError('Device ID set');
    }

    return Options(
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': _projectApiKey,
        'x-project-id': _projectId,
        'x-user-id': _userId!,
        'x-device-id': _deviceId,
      },
    );
  }

  Future<ChangeProcessingResponse> sendChanges(ChangeSet changes) async {
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
      log('Request failed', error: e.response);
      rethrow;
    } catch (e) {
      log('Request failed', error: e);
      rethrow;
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
          'x-api-key': _projectApiKey,
        }
      });

      _socket!.onConnect((_) => log('Socket.IO connected'));

      _socket!.onDisconnect((_) => log('Socket.IO disconnected'));

      _socket!.on('changes', (data) {
        if (onChangesReceived != null) {
          final changelogs = List.from(data).map((raw) => ChangeLog.fromJson(raw));
          onChangesReceived!(changelogs);
        }
      });

      _socket!.onError((error) {
        log('Socket.IO error: $error');
      });

      _socket!.connect();
    } catch (e) {
      log('Socket.IO connection failed: $e');
    }
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
    _dio.close();
  }
}
