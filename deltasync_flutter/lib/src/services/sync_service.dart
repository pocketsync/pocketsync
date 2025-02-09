import 'package:dio/dio.dart';
import '../models/change_set.dart';
import '../errors/sync_error.dart';

class SyncService {
  final String serverUrl;
  final String projectId;
  final String apiKey;
  final String userIdentifier;
  late final Dio _dio;

  SyncService({
    required this.serverUrl,
    required this.projectId,
    required this.apiKey,
    required this.userIdentifier,
  }) {
    _dio = Dio(BaseOptions(
      baseUrl: serverUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-project-id': projectId,
        'x-api-key': apiKey,
        'x-user-identifier': userIdentifier,
      },
    ));
  }

  Future<void> uploadChanges(ChangeSet changeSet) async {
    try {
      final response = await _dio.post(
        '/sdk/changes',
        data: changeSet.toJson(),
      );

      if (response.statusCode != 200) {
        throw SyncError('Failed to upload changes: ${response.data}');
      }
    } on DioException catch (e) {
      throw SyncError('Failed to communicate with sync server: ${e.message}');
    }
  }

  void dispose() {
    _dio.close();
  }
}
