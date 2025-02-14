import 'package:flutter_test/flutter_test.dart';
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'helpers/test_helpers.dart';

void main() {
  late PocketSync pocketSync;

  setUpAll(() {
    TestWidgetsFlutterBinding.ensureInitialized();
    // Initialize FFI for sqflite
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  setUp(() {
    pocketSync = PocketSync.instance;
  });

  group('PocketSync initialization', () {
    test('should initialize successfully', () async {
      // Arrange
      final options = TestHelpers.getMockOptions();
      final dbOptions = TestHelpers.getMockDatabaseOptions();

      // Act & Assert
      await expectLater(
        pocketSync.initialize(
          dbPath: 'test.db',
          options: options,
          databaseOptions: dbOptions,
        ),
        completes,
      );
    });
  });

  // TODO: Change approach as the singleton is preventing network service override
  // group('Sync operations', () {
  //   setUp(() async {
  //     final options = TestHelpers.getMockOptions();
  //     final dbOptions = TestHelpers.getMockDatabaseOptions();

  //     await pocketSync.initialize(
  //       dbPath: 'test.db',
  //       options: options,
  //       databaseOptions: dbOptions,
  //     );
  //   });

  //   test('should not sync when userId is not set', () async {
  //     // Act
  //     await pocketSync.startSync();

  //     // Assert
  //     verifyNever(() => mockNetworkService.sendChanges(any()));
  //   });

  //   test('should pause sync when requested', () async {
  //     // Arrange
  //     await pocketSync.setUserId(userId: 'test-user');

  //     // Act
  //     await pocketSync.pauseSync();

  //     // Assert
  //     verify(() => mockNetworkService.disconnect()).called(1);
  //   });

  //   test('should resume sync when requested', () async {
  //     // Arrange
  //     await pocketSync.setUserId(userId: 'test-user');
  //     await pocketSync.pauseSync();

  //     // Act
  //     await pocketSync.resumeSync();

  //     // Assert
  //     verify(() => mockNetworkService.reconnect()).called(1);
  //   });
  // });
}
