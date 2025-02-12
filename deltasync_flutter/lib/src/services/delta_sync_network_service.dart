import 'package:deltasync_flutter/src/models/change_processing_response.dart';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:dio/dio.dart';

class DeltaSyncNetworkService {
  final Dio _dio;
  final String _serverUrl;
  final String _projectId;
  final String _projectApiKey;
  String? _userId;

  DeltaSyncNetworkService({
    required String serverUrl,
    required String projectId,
    required String projectApiKey,
  })  : _dio = Dio(),
        _serverUrl = serverUrl,
        _projectId = projectId,
        _projectApiKey = projectApiKey;

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
        'X-API-Key': _projectApiKey,
        'X-User-ID': _userId!,
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

  Future<ChangeSet> fetchRemoteChanges() async {
    final url = '$_serverUrl/sync/$_projectId/remote-changes';
    final response = await _dio.get(
      url,
      options: _getRequestOptions(),
    );

    return ChangeSet.fromJson(response.data);
  }

  void dispose() {
    _dio.close();
  }
}
