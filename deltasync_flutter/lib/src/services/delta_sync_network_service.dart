import 'dart:developer';

import 'package:deltasync_flutter/src/errors/sync_error.dart';
import 'package:deltasync_flutter/src/models/change_log.dart';
import 'package:deltasync_flutter/src/models/change_processing_response.dart';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:dio/dio.dart';

class DeltaSyncNetworkService {
  final Dio _dio;

  final String _serverUrl;
  final String _projectId;
  final String _projectApiKey;
  String? _userId;
  String? _deviceId;

  DeltaSyncNetworkService({
    required String serverUrl,
    required String projectId,
    required String projectApiKey,
    String? deviceId,
  })  : _dio = Dio(),
        _serverUrl = serverUrl,
        _projectId = projectId,
        _projectApiKey = projectApiKey;

  void setUserId(String userId) => _userId = userId;

  void setDeviceId(String deviceId) => _deviceId = deviceId;

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

  Future<List<ChangeLog>> fetchRemoteChanges({
    required DateTime? lastFetchedAt,
  }) async {
    final url = '$_serverUrl/sdk/changes';
    final response = await _dio.get(
      url,
      options: _getRequestOptions(),
      data: {'lastFetchedAt': lastFetchedAt?.toIso8601String()},
    );

    return ChangeLog.fromJsonList(response.data as List);
  }

  void dispose() {
    _dio.close();
  }
}
