import 'package:mocktail/mocktail.dart';
import 'package:deltasync_flutter/deltasync_flutter.dart';
import 'package:deltasync_flutter/src/services/delta_sync_network_service.dart';
import 'package:deltasync_flutter/src/services/changes_processor.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import '../services/changes_processor_test.dart';

// Mock classes
class MockDeltaSyncNetworkService extends Mock
    implements DeltaSyncNetworkService {}

class MockTransaction extends Mock implements Transaction {
  @override
  Future<List<Map<String, Object?>>> query(
    String table, {
    bool? distinct,
    List<String>? columns,
    String? where,
    List<Object?>? whereArgs,
    String? groupBy,
    String? having,
    String? orderBy,
    int? limit,
    int? offset,
  }) async {
    return [];
  }

  @override
  Future<int> delete(
    String table, {
    String? where,
    List<Object?>? whereArgs,
  }) async {
    return 1;
  }

  @override
  Future<int> update(String table, Map<String, Object?> values,
      {String? where,
      List<Object?>? whereArgs,
      ConflictAlgorithm? conflictAlgorithm}) async {
    return 1;
  }

  @override
  Future<int> insert(String table, Map<String, Object?> values,
      {String? nullColumnHack, ConflictAlgorithm? conflictAlgorithm}) async {
    return 1;
  }

  @override
  Future<int> rawDelete(String sql, [List<Object?>? arguments]) async {
    return 1;
  }

  @override
  Future<int> rawUpdate(String sql, [List<Object?>? arguments]) async {
    return 1;
  }

  @override
  Future<int> rawInsert(String sql, [List<Object?>? arguments]) async {
    return 1;
  }

  @override
  Future<List<Map<String, Object?>>> rawQuery(String sql,
      [List<Object?>? arguments]) async {
    return [];
  }

  @override
  Batch batch() {
    final mockBatch = MockBatch();
    when(() => mockBatch.commit()).thenAnswer((_) async => <Object?>[1]);
    return mockBatch;
  }
}

class MockDeltaSyncDatabase extends Mock implements DeltaSyncDatabase {
  dynamic error;
  @override
  Future<T> transaction<T>(Future<T> Function(Transaction) action) async {
    if (error != null) {
      throw error;
    }
    
    return Future.value();
  }
}

class MockChangesProcessor extends Mock implements ChangesProcessor {}

// Test utilities
class TestHelpers {
  static DeltaSyncOptions getMockOptions() {
    return DeltaSyncOptions(
      projectId: 'test-project',
      authToken: 'test-token',
      serverUrl: 'http://localhost:3000',
    );
  }

  static DatabaseOptions getMockDatabaseOptions() {
    return DatabaseOptions(
      onCreate: (db, version) async {},
    );
  }
}
