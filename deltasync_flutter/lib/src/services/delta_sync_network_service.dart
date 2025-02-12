import 'package:deltasync_flutter/src/models/change_processing_response.dart';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:deltasync_flutter/src/services/device_manager.dart';
import 'package:dio/dio.dart';

class DeltaSyncNetworkService {
  final Dio _dio;
  final DeviceManager _deviceManager;
  final String _serverUrl;
  final String _projectId;
  final String _projectApiKey;
  String? _userId;

  DeltaSyncNetworkService({
    required DeviceManager deviceManager,
    required String serverUrl,
    required String projectId,
    required String projectApiKey,
  })  : _dio = Dio(),
        _serverUrl = serverUrl,
        _projectId = projectId,
        _projectApiKey = projectApiKey,
        _deviceManager = deviceManager;

  void setUserId(String userId) {
    _userId = userId;
  }

  Options _getRequestOptions() {
    if (_userId == null) {
      throw Exception('User ID not set');
    }

    return Options(
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': _projectApiKey,
        'x-project-id': _projectId,
        'x-user-id': _userId!,
        'x-device-id': _deviceManager.getDeviceId(),
      },
    );
  }

  Future<ChangeProcessingResponse> sendChanges(ChangeSet changes) async {
    final url = '$_serverUrl/sync/$_projectId/changes';
    final response = await _dio.post(
      url,
      options: _getRequestOptions(),
      data: changes.toJson(),
    );

    return ChangeProcessingResponse.fromJson(response.data);
  }

  Future<ChangeSet> fetchRemoteChanges({
    required DateTime? lastFetchedAt,
  }) async {
    final url = '$_serverUrl/sdk/changes';
    final response = await _dio.get(url, options: _getRequestOptions(), data: {
      'lastFetchedAt': lastFetchedAt,
    });

    return ChangeSet.fromJson(response.data);
  }

  void dispose() {
    _dio.close();
  }
}
