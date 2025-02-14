import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:deltasync_flutter/src/services/changes_processor.dart';
import 'package:sqflite/sqflite.dart';
import '../helpers/test_helpers.dart';

class MockBatch extends Mock implements Batch {}

void main() {
  late ChangesProcessor processor;
  late MockDeltaSyncDatabase mockDatabase;

  setUp(() {
    mockDatabase = MockDeltaSyncDatabase();
    registerFallbackValue(<String, dynamic>{});
    registerFallbackValue('test_table');
    registerFallbackValue({'field': 'updated', 'id': '123'});
    registerFallbackValue(<Future<void> Function(Transaction)>{});
    registerFallbackValue(MockTransaction());
    processor = ChangesProcessor(
      mockDatabase,
      conflictResolver: TestHelpers.getMockOptions().conflictResolver,
    );

    when(() => mockDatabase.query(any())).thenAnswer((_) async => [
          {
            'id': 1,
            'table_name': 'test_table',
            'record_id': '123',
            'operation': 'INSERT',
            'data': jsonEncode(
                {'field': 'value', 'id': '123', 'table': 'test_table'}),
            'version': 1,
            'timestamp': DateTime.now().millisecondsSinceEpoch,
            'synced': 0
          },
        ]);
  });

  group('ChangesProcessor', () {
    test('should get unsynced changes successfully', () async {
      // Arrange
      when(() => mockDatabase.query(
            '__deltasync_changes',
            where: 'synced = 0 AND id > ?',
            whereArgs: any(named: 'whereArgs'),
            orderBy: 'id ASC',
            limit: any(named: 'limit'),
          )).thenAnswer((_) async => [
            {
              'id': 1,
              'table_name': 'test_table',
              'record_id': '123',
              'operation': 'INSERT',
              'data': jsonEncode(
                  {'field': 'value', 'id': '123', 'table': 'test_table'}),
              'version': 1,
              'timestamp': DateTime.now().millisecondsSinceEpoch,
              'synced': 0
            },
          ]);

      // Second query should return empty to break the loop
      when(() => mockDatabase.query(
            '__deltasync_changes',
            where: 'synced = 0 AND id > ?',
            whereArgs: [1],
            orderBy: 'id ASC',
            limit: any(named: 'limit'),
          )).thenAnswer((_) async => []);

      // Act
      final changes = await processor.getUnSyncedChanges();

      // Assert
      expect(changes.insertions.changes.length, 1);
      expect(changes.updates.changes.length, 0);
      expect(changes.deletions.changes.length, 0);

      // Verify correct query parameters
      verify(() => mockDatabase.query(
            '__deltasync_changes',
            where: 'synced = 0 AND id > ?',
            whereArgs: [0],
            orderBy: 'id ASC',
            limit: any(named: 'limit'),
          )).called(1);
    });

    test('should mark changes as synced', () async {
      // Arrange
      final mockBatch = MockBatch();
      when(() => mockDatabase.batch()).thenReturn(mockBatch);
      when(() => mockBatch.commit()).thenAnswer((_) async => <Object?>[]);

      // Act
      await processor.markChangesSynced([1, 2]);

      // Assert
      verify(() => mockDatabase.batch()).called(1);
      verify(() => mockBatch.update(
            '__deltasync_changes',
            {'synced': 1},
            where: 'id = ?',
            whereArgs: [1],
          )).called(1);
      verify(() => mockBatch.update(
            '__deltasync_changes',
            {'synced': 1},
            where: 'id = ?',
            whereArgs: [2],
          )).called(1);
      verify(() => mockBatch.commit()).called(1);
    });
    // test('should handle conflicts during remote change application', () async {
    //   // Arrange
    //   final remoteChanges = [
    //     ChangeLog(
    //       id: 1,
    //       userIdentifier: 'test-user',
    //       deviceId: 'test-device',
    //       changeSet: ChangeSet.fromJson({
    //         'tableName': 'test_table',
    //         'recordId': '123',
    //         'operation': 'update',
    //         'data': '{"field":"conflict"}',
    //         'timestamp': 1234567890,
    //         'version': 1,
    //         'insertions': <String, dynamic>{},
    //         'updates': <String, dynamic>{},
    //         'deletions': <String, dynamic>{}
    //       }),
    //       receivedAt: DateTime.now(),
    //     ),
    //   ];

    //   when(() => mockDatabase.transaction(any())).thenAnswer(
    //     (invocation) async {
    //       throw ConflictError(
    //         'Conflict detected',
    //         entityId: '123',
    //         entityType: 'test_table',
    //       );
    //     },
    //   );

    //   // Act & Assert
    //   await expectLater(
    //     processor.applyRemoteChanges(remoteChanges),
    //     throwsA(isA<ConflictError>()),
    //   );
    // });
  
    // TODO: Test changes application
  });
}
