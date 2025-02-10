import 'dart:developer';

import 'package:deltasync_flutter/src/models/change_log.dart';
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
  bool _isDisposed = false;

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
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
    ));

    _dio.interceptors
      ..add(
        RetryInterceptor(
          dio: _dio,
          logPrint: log,
          retries: _maxRetries,
          retryDelays: _retryDelays,
        ),
      )
      ..add(LogInterceptor(
        logPrint: (message) => log(message.toString()),
        requestBody: true,
        responseBody: true,
      ));
  }

  Future<void> uploadChanges(ChangeSet changeSet) async {
    if (_isDisposed) {
      throw StateError('SyncService has been disposed');
    }

    try {
      final deviceId = deviceManager.getDeviceId();
      log('Uploading changes for device $deviceId: ${changeSet.toJson()}');

      final response = await _dio.post(
        '/sdk/changes',
        data: {
          'deviceId': deviceId,
          'changeSet': changeSet.toJson(),
        },
        options: Options(
          validateStatus: (status) => status != null && status >= 200 && status < 300,
          headers: {
            'Content-Type': 'application/json',
            'x-project-id': projectId,
            'x-api-key': apiKey,
            'x-user-identifier': userIdentifier,
          }
        ),
      );

      if (response.data == null) {
        throw SyncError('Invalid response from server: empty response');
      }

      log('Changes uploaded successfully: ${response.data}');
      await changeTracker.markChangesAsSynced(changeSet.timestamp);
    } on DioException catch (e) {
      log('Error uploading changes: ${e.message}\nResponse: ${e.response?.data}');
      
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw SyncError('Network error: ${e.message}', innerError: e);
      }
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        throw SyncError('Authentication failed: ${e.message}', innerError: e);
      }
      if (e.response?.statusCode == 500) {
        log('Server error details: ${e.response?.data}');
        throw SyncError('Server error: ${e.response?.data ?? e.message}', innerError: e);
      }
      throw SyncError('Failed to communicate with sync server: ${e.message}', innerError: e);
    } catch (e) {
      log('Unexpected error during sync: $e');
      throw SyncError('Unexpected error during sync: $e');
    }
  }

  Future<List<ChangeLog>> fetchChanges(int lastProcessedChangeId) async {
    if (_isDisposed) {
      throw StateError('SyncService has been disposed');
    }

    try {
      final deviceId = deviceManager.getDeviceId();
      final response = await _dio.get(
        '/sdk/changes',
        data: {'lastProcessedChangeId': lastProcessedChangeId},
        options: Options(
          validateStatus: (status) => status != null && status >= 200 && status < 300,
          headers: {
            'Content-Type': 'application/json',
            'x-project-id': projectId,
            'x-api-key': apiKey,
            'x-user-identifier': userIdentifier,
            'x-device-id': deviceId,
          }
        ),
      );

      if (response.data == null) {
        return [];
      }

      return (response.data as List)
          .map((item) => ChangeLog.fromJson(item))
          .toList();
    } on DioException catch (e) {
      log('Error fetching changes: ${e.message}\nResponse: ${e.response?.data}');
      
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw SyncError('Network error: ${e.message}', innerError: e);
      }
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        throw SyncError('Authentication failed: ${e.message}', innerError: e);
      }
      throw SyncError('Failed to fetch changes: ${e.message}', innerError: e);
    } catch (e) {
      log('Unexpected error fetching changes: $e');
      throw SyncError('Unexpected error fetching changes: $e');
    }
  }

  void dispose() {
    _isDisposed = true;
    _dio.close(force: true);
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
    if (error.type == DioExceptionType.cancel) {
      return false; // Don't retry cancelled requests
    }

    log('Network error occurred: ${error.message}');
    if (error.response != null) {
      log('Response status: ${error.response?.statusCode}');
      log('Response data: ${error.response?.data}');
    }

    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        (error.response?.statusCode ?? 0) >= 500;
  }
}
