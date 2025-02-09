import 'package:deltasync_flutter/src/services/change_tracker.dart';
import 'package:deltasync_flutter/src/services/device_manager.dart';
import 'package:dio/dio.dart';
import '../models/change_set.dart';
import '../errors/sync_error.dart';

class SyncService {
  final String serverUrl;
  final String projectId;
  final String apiKey;
  final String userIdentifier;
  final DeviceManager deviceManager;
  final ChangeTracker changeTracker;
  late final Dio _dio;

  static const _maxRetries = 3;
  static const _retryDelays = [
    Duration(seconds: 5),
    Duration(seconds: 15),
    Duration(seconds: 30),
  ];

  SyncService({
    required this.serverUrl,
    required this.projectId,
    required this.apiKey,
    required this.userIdentifier,
    required this.changeTracker,
    required this.deviceManager,
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

    _dio.interceptors.add(
      RetryInterceptor(
        dio: _dio,
        logPrint: print,
        retries: _maxRetries,
        retryDelays: _retryDelays,
      ),
    );
  }

  Future<void> uploadChanges(ChangeSet changeSet) async {
    try {
      final response = await _dio.post(
        '/sdk/changes',
        data: {
          'deviceId': deviceManager.getDeviceId(),
          'changeSet': changeSet.toJson(),
        },
      );

      if (response.statusCode == 200) {
        await changeTracker.markChangesAsSynced(changeSet.timestamp);
      } else {
        throw SyncError('Failed to upload changes: ${response.data}');
      }
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        rethrow;
      }
      throw SyncError('Failed to communicate with sync server: ${e.message}');
    }
  }

  void dispose() {
    _dio.close();
  }
}

class RetryInterceptor extends Interceptor {
  final Dio dio;
  final int retries;
  final List<Duration> retryDelays;
  final Function(String message) logPrint;

  RetryInterceptor({
    required this.dio,
    required this.logPrint,
    this.retries = 3,
    this.retryDelays = const [
      Duration(seconds: 5),
      Duration(seconds: 15),
      Duration(seconds: 30),
    ],
  });

  @override
  Future onError(DioException err, ErrorInterceptorHandler handler) async {
    var extra = err.requestOptions.extra;
    var retryCount = extra['retryCount'] ?? 0;

    if (_shouldRetry(err) && retryCount < retries) {
      await Future.delayed(retryDelays[retryCount]);

      extra['retryCount'] = ++retryCount;
      logPrint('Retry attempt $retryCount for ${err.requestOptions.path}');

      try {
        final response = await dio.fetch(err.requestOptions..extra = extra);
        return handler.resolve(response);
      } catch (e) {
        return handler.next(err);
      }
    }

    return handler.next(err);
  }

  bool _shouldRetry(DioException error) {
    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.response?.statusCode == 503;
  }
}
