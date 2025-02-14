import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:deltasync_flutter/src/services/delta_sync_network_service.dart';
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:deltasync_flutter/src/models/change_processing_response.dart';
import 'package:deltasync_flutter/src/errors/sync_error.dart';
import 'package:dio/dio.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late DeltaSyncNetworkService networkService;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    networkService = DeltaSyncNetworkService(
      serverUrl: 'http://localhost:3000',
      projectId: 'test-project',
      authToken: 'test-token',
      dio: mockDio,
    );
  });

  group('DeltaSyncNetworkService', () {
    test('should throw InitializationError when sending changes without user ID and device ID', () {
      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<InitializationError>()),
      );
    });

    test('should throw InitializationError when sending changes with only user ID', () {
      networkService.setUserId('test-user');

      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<InitializationError>()),
      );
    });

    test('should throw InitializationError when sending changes with only device ID', () {
      networkService.setDeviceId('test-device');

      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<InitializationError>()),
      );
    });

    test('should successfully send changes when both user ID and device ID are set', () async {
      // Arrange
      final mockResponse = Response(
        data: {'status': 'success', 'processed': true, 'message': 'Changes processed successfully'},
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
        statusMessage: 'OK',
      );
      when(() => mockDio.post(
            any(),
            data: any(named: 'data'),
            options: any(named: 'options'),
          )).thenAnswer((_) async => mockResponse);

      networkService.setUserId('test-user');
      networkService.setDeviceId('test-device');

      // Act
      final result = await networkService.sendChanges(ChangeSet.empty());

      // Assert
      expect(result, isA<ChangeProcessingResponse>());
      expect(result.status, equals('success'));
      expect(result.processed, isTrue);
    });

    test('should throw NetworkError on DioException', () async {
      // Arrange
      when(() => mockDio.post(
            any(),
            data: any(named: 'data'),
            options: any(named: 'options'),
          )).thenThrow(DioException(
            response: Response(
              statusCode: 500,
              statusMessage: 'Server Error',
              requestOptions: RequestOptions(path: ''),
            ),
            requestOptions: RequestOptions(path: ''),
          ));

      networkService.setUserId('test-user');
      networkService.setDeviceId('test-device');

      // Act & Assert
      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<NetworkError>()),
      );
    });

    test('should throw InitializationError when sending changes without device ID', () {
      // Arrange
      networkService.setUserId('test-user');

      // Act & Assert
      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<InitializationError>()),
      );
    });

    test('should handle network errors correctly', () async {
      // Arrange
      networkService.setUserId('test-user');
      networkService.setDeviceId('test-device');

      when(() => mockDio.post(
            any(),
            data: any(named: 'data'),
            options: any(named: 'options'),
          )).thenThrow(DioException(
            requestOptions: RequestOptions(path: ''),
            response: Response(
              statusCode: 500,
              requestOptions: RequestOptions(path: ''),
            ),
          ));

      // Act & Assert
      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<NetworkError>()),
      );
    });

    test('should disconnect and reconnect WebSocket correctly', () {
      // Act & Assert
      expect(() => networkService.disconnect(), returnsNormally);
      expect(() => networkService.reconnect(), returnsNormally);
    });

    test('should throw InitializationError when sending changes without device ID', () {
      // Arrange
      networkService.setUserId('test-user');

      // Act & Assert
      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<InitializationError>()),
      );
    });

    test('should handle network errors correctly', () async {
      // Arrange
      networkService.setUserId('test-user');
      networkService.setDeviceId('test-device');

      when(() => mockDio.post(
            any(),
            data: any(named: 'data'),
            options: any(named: 'options'),
          )).thenThrow(DioException(
            requestOptions: RequestOptions(path: ''),
            response: Response(
              statusCode: 500,
              requestOptions: RequestOptions(path: ''),
            ),
          ));

      // Act & Assert
      expect(
        () => networkService.sendChanges(ChangeSet.empty()),
        throwsA(isA<NetworkError>()),
      );
    });

    test('should disconnect and reconnect WebSocket correctly', () {
      // Act & Assert
      expect(() => networkService.disconnect(), returnsNormally);
      expect(() => networkService.reconnect(), returnsNormally);
    });
  });
}