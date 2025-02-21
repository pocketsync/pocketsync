import 'dart:async';

import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/database/database_change_manager.dart';
import 'package:pocketsync_flutter/src/database/query_watcher.dart';
import 'package:pocketsync_flutter/src/database/transaction_wrapper.dart';
import 'package:pocketsync_flutter/src/services/device_fingerprint_service.dart';
import 'package:pocketsync_flutter/src/utils/table_utils.dart';
import 'package:sqflite/sqflite.dart';

/// PocketSync database service for managing local database operations
/// with the ability to track changes and sync them with a remote server
class PocketSyncDatabase extends DatabaseExecutor {
  final DatabaseChangeManager _changeManager;
  Database? _db;

  PocketSyncDatabase({
    DatabaseChangeManager? changeManager,
  }) : _changeManager = changeManager ?? DatabaseChangeManager();

  /// Opens and initializes the database
  Future<Database> initialize({
    required String dbPath,
    required DatabaseOptions options,
  }) async {
    _db = await openDatabase(
      dbPath,
      version: options.version,
      onConfigure: (db) async {
        // Configure database before any schema operations
        await options.onConfigure?.call(db);
        await db.execute('PRAGMA foreign_keys = ON');
      },
      onCreate: (db, version) async {
        // 1. Create user tables first
        await options.onCreate(db, version);

        // 2. Initialize PocketSync tables
        await _initializePocketSyncTables(db);

        // 3. Setup change tracking for all tables
        await _setupChangeTracking(db);

        // 4. Insert initial version records for all tables
        await _initializeTableVersions(db);
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        // 1. Backup existing triggers
        await _backupTriggers(db);

        // 2. Drop existing change tracking triggers
        await _dropChangeTracking(db);

        // 3. Perform user schema upgrade
        await options.onUpgrade?.call(db, oldVersion, newVersion);

        // 4. Re-setup change tracking with updated schema
        await _setupChangeTracking(db);

        // 5. Increment version for affected tables
        await _updateTableVersions(db);
      },
      onOpen: (db) async {
        await options.onOpen?.call(db);

        // Verify change tracking integrity
        await _verifyChangeTracking(db);
      },
      singleInstance: true,
    );
    return _db!;
  }

  Future<T> transaction<T>(Future<T> Function(Transaction txn) action) async {
    final affectedTables = <String>{};
    final result = await _db!.transaction((txn) async {
      try {
        return await action(TransactionWrapper(txn, affectedTables));
      } catch (e) {
        rethrow;
      }
    });

    if (affectedTables.isNotEmpty) {
      for (final table in affectedTables) {
        _changeManager.notifyChange(table);
      }
    }
    return result;
  }

  /// Updates version numbers for all tables after a schema upgrade
  Future<void> _updateTableVersions(Database db) async {
    final tables = await _getUserTables(db);
    final batch = db.batch();

    for (final table in tables) {
      batch.rawUpdate(
        'UPDATE __pocketsync_version SET version = version + 1 WHERE table_name = ?',
        [table],
      );
    }

    await batch.commit();
  }

  /// Initializes version records for all tables
  Future<void> _initializeTableVersions(Database db) async {
    final tables = await _getUserTables(db);
    final batch = db.batch();

    for (final table in tables) {
      batch.insert(
        '__pocketsync_version',
        {'table_name': table, 'version': 1},
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );
    }

    await batch.commit();
  }

  Future<void> _backupTriggers(Database db) async {
    final triggers = await db.query('sqlite_master',
        where: "type = 'trigger' AND name LIKE 'after_%'");

    final batch = db.batch();
    for (final trigger in triggers) {
      final tableName = trigger['tbl_name'] as String;
      final triggerName = trigger['name'] as String;
      final triggerSql = trigger['sql'] as String;

      batch.insert(
        '__pocketsync_trigger_backup',
        {
          'table_name': tableName,
          'trigger_name': triggerName,
          'trigger_sql': triggerSql,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit();
  }

  Future<void> _dropChangeTracking(Database db) async {
    final triggers = await db.query('sqlite_master',
        where: "type = 'trigger' AND name LIKE 'after_%'");

    for (final trigger in triggers) {
      await db.execute(
        "DROP TRIGGER IF EXISTS ${trigger['name']}",
      );
    }
  }

  Future<void> _verifyChangeTracking(Database db) async {
    final tables = await _getUserTables(db);
    final existingTriggers = await db.query(
      'sqlite_master',
      where: "type = 'trigger' AND name LIKE 'after_%'",
    );

    final expectedTriggerCount = tables.length * 3; // INSERT, UPDATE, DELETE
    if (existingTriggers.length != expectedTriggerCount) {
      // Re-setup change tracking if triggers are missing
      await _setupChangeTracking(db);
    }
  }

  Future<void> close() async {
    _changeManager.dispose();
    await _db?.close();
    _db = null;
  }

  /// Executes a raw SQL query
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  @override
  Future<List<Map<String, dynamic>>> query(
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
    return await _db!.query(
      table,
      distinct: distinct,
      columns: columns,
      where: where,
      whereArgs: whereArgs,
      groupBy: groupBy,
      having: having,
      orderBy: orderBy,
      limit: limit,
      offset: offset,
    );
  }

  @override
  Future<void> execute(String sql, [List<Object?>? arguments]) {
    return _db!.execute(sql, arguments);
  }

  /// Inserts a row into the specified table
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  @override
  Future<int> insert(
    String table,
    Map<String, Object?> values, {
    String? nullColumnHack,
    ConflictAlgorithm? conflictAlgorithm,
  }) async {
    values = await _ensurePsGlobalId(values);

    final result = await _db!.insert(
      table,
      values,
      nullColumnHack: nullColumnHack,
      conflictAlgorithm: conflictAlgorithm,
    );

    await _notifyChanges([table]);

    return result;
  }

  /// Updates rows in the specified table
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  @override
  Future<int> update(
    String table,
    Map<String, Object?> values, {
    String? where,
    List<Object?>? whereArgs,
    ConflictAlgorithm? conflictAlgorithm,
  }) async {
    final result = await _db!.update(
      table,
      values,
      where: where,
      whereArgs: whereArgs,
      conflictAlgorithm: conflictAlgorithm,
    );

    await _notifyChanges([table]);

    return result;
  }

  /// Deletes rows from the specified table
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  @override
  Future<int> delete(
    String table, {
    String? where,
    List<Object?>? whereArgs,
  }) async {
    final result = await _db!.delete(
      table,
      where: where,
      whereArgs: whereArgs,
    );

    await _notifyChanges([table]);

    return result;
  }

  /// Executes a raw SQL query with optional arguments
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  @override
  Future<List<Map<String, dynamic>>> rawQuery(
    String sql, [
    List<Object?>? arguments,
  ]) async {
    final tables = extractAffectedTables(sql);
    final isInsertOperation = sql.trim().toUpperCase().startsWith('INSERT');

    if (isInsertOperation) {
      // Inject ps_global_id for INSERT operations
      final psGlobalId = await _generatePsGlobalId();
      sql = sql.replaceFirst(')', ', ps_global_id)');
      sql = sql.replaceFirst('?)', '?, ?)');
      arguments = (arguments ?? [])..add(psGlobalId);
    }

    final result = await _db!.rawQuery(sql, arguments);

    // Check if the query modifies data
    final normalizedSql = sql.trim().toUpperCase();
    if (isInsertOperation ||
        normalizedSql.startsWith('UPDATE') ||
        normalizedSql.startsWith('DELETE')) {
      await _notifyChanges(tables);
    }

    return result;
  }

  /// Starts a batch operation
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  @override
  Batch batch() {
    final batch = _db!.batch();
    return _PocketSyncBatch(batch);
  }

  /// Commits a batch operation and notifies changes
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<List<Object?>> commit(Batch batch) async {
    final result = await batch.commit();
    await _notifyChanges((batch as _PocketSyncBatch)._affectedTables);
    return result;
  }

  /// Applies a batch operation without reading the results and notifies changes
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<void> apply(Batch batch) async {
    await batch.apply();
    await _notifyChanges((batch as _PocketSyncBatch)._affectedTables);
  }

  @override
  Database get database => _db!;

  @override
  Future<QueryCursor> queryCursor(String table,
      {bool? distinct,
      List<String>? columns,
      String? where,
      List<Object?>? whereArgs,
      String? groupBy,
      String? having,
      String? orderBy,
      int? limit,
      int? offset,
      int? bufferSize}) {
    return _db!.queryCursor(
      table,
      distinct: distinct,
      columns: columns,
      where: where,
      whereArgs: whereArgs,
      groupBy: groupBy,
      having: having,
      orderBy: orderBy,
      limit: limit,
      offset: offset,
      bufferSize: bufferSize,
    );
  }

  @override
  Future<int> rawDelete(String sql, [List<Object?>? arguments]) {
    final result = _db!.rawDelete(sql, arguments);
    final tables = extractAffectedTables(sql);
    _notifyChanges(tables);

    return result;
  }

  @override
  Future<int> rawInsert(String sql, [List<Object?>? arguments]) async {
    final result = await _db!.rawInsert(sql, arguments);
    final tables = extractAffectedTables(sql);
    await _notifyChanges(tables);
    return result;
  }

  @override
  Future<QueryCursor> rawQueryCursor(String sql, List<Object?>? arguments,
      {int? bufferSize}) {
    return _db!.rawQueryCursor(
      sql,
      arguments,
      bufferSize: bufferSize,
    );
  }

  @override
  Future<int> rawUpdate(String sql, [List<Object?>? arguments]) {
    final result = _db!.rawUpdate(sql, arguments);
    final tables = extractAffectedTables(sql);
    _notifyChanges(tables);
    return result;
  }

  /// Sets up the initial PocketSync system tables
  Future<void> _initializePocketSyncTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_rowid TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL,
        synced INTEGER DEFAULT 0
      );

      -- Create indexes for optimizing queries
      CREATE INDEX idx_pocketsync_changes_synced ON __pocketsync_changes(synced);
      CREATE INDEX idx_pocketsync_changes_version ON __pocketsync_changes(version);
      CREATE INDEX idx_pocketsync_changes_timestamp ON __pocketsync_changes(timestamp);
      CREATE INDEX idx_pocketsync_changes_table_name ON __pocketsync_changes(table_name);
      CREATE INDEX idx_pocketsync_changes_record_rowid ON __pocketsync_changes(record_rowid)
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_version (
        table_name TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_device_state (
        device_id TEXT PRIMARY KEY,
        last_sync_timestamp INTEGER NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_processed_changes (
        change_log_id INTEGER PRIMARY KEY,
        processed_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_trigger_backup (
        table_name TEXT NOT NULL,
        trigger_name TEXT NOT NULL,
        trigger_sql TEXT NOT NULL,
        PRIMARY KEY (table_name, trigger_name)
      )
    ''');

    final deviceFingerprintService = DeviceFingerprintService(db);
    final deviceId = await deviceFingerprintService.getDeviceFingerprint(db);
    await db.insert(
      '__pocketsync_device_state',
      {'device_id': deviceId, 'last_sync_timestamp': null},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Sets up change tracking triggers for all user tables
  Future<List<String>> _getUserTables(Database db) async {
    final tables = await db.query(
      'sqlite_master',
      where: "type = 'table' AND name NOT LIKE '__pocketsync_%' "
          "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%' "
          "AND name NOT LIKE 'ios_%' AND name NOT LIKE '.%' "
          "AND name NOT LIKE 'system_%' AND name NOT LIKE 'sys_%'",
    );

    return tables.map((t) => t['name'] as String).toList();
  }

  Future<void> _setupChangeTracking(Database db) async {
    final tables = await _getUserTables(db);

    for (final tableName in tables) {
      // Add ps_global_id column to user tables
      await db.execute('''
        SELECT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM pragma_table_info('$tableName') WHERE name = 'ps_global_id'
          )
          THEN 'ALTER TABLE $tableName ADD COLUMN ps_global_id TEXT NULL'
        END as sql_statement
        WHERE sql_statement IS NOT NULL;
        CREATE INDEX idx_${tableName}_ps_global_id ON $tableName(ps_global_id);
      ''');

      await _createTableTriggers(db, tableName);
    }
  }

  /// Creates triggers for a specific table
  Future<void> _createTableTriggers(Database db, String tableName) async {
    final columns = (await db
            .rawQuery("SELECT name FROM pragma_table_info(?)", [tableName]))
        .map((row) => row['name'] as String)
        .toList();

    // UPDATE trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_update_$tableName
      AFTER UPDATE ON $tableName
      WHEN ${_generateUpdateCondition(columns)}
      BEGIN
        INSERT INTO __pocketsync_changes (
          table_name, record_rowid, operation, timestamp, data, version
        ) VALUES (
          '$tableName',
          NEW.ps_global_id,
          'UPDATE',
          (strftime('%s', 'now') * 1000),
          json_object(
            'old', json_object(${columns.map((col) => "'$col', OLD.$col").join(', ')}),
            'new', json_object(${columns.map((col) => "'$col', NEW.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __pocketsync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __pocketsync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
        
        SELECT changes.*
        FROM __pocketsync_changes changes
        WHERE changes.id = last_insert_rowid()
        AND EXISTS (SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__pocketsync_changes')
        AND (SELECT RAISE(ROLLBACK, 'Trigger callback failed')
             WHERE NOT EXISTS (SELECT 1 FROM __pocketsync_changes WHERE id = last_insert_rowid()));
      END;
    ''');

    // AFTER INSERT trigger for change tracking
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_insert_$tableName
      AFTER INSERT ON $tableName
      BEGIN
        INSERT INTO __pocketsync_changes (
          table_name, record_rowid, operation, timestamp, data, version
        ) VALUES (
          '$tableName',
          (SELECT ps_global_id FROM $tableName WHERE rowid = NEW.rowid),
          'INSERT',
          (strftime('%s', 'now') * 1000),
          json_object(
            'new', json_object(${columns.map((col) => "'$col', NEW.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __pocketsync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __pocketsync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
        
        SELECT changes.*
        FROM __pocketsync_changes changes
        WHERE changes.id = last_insert_rowid()
        AND EXISTS (SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__pocketsync_changes')
        AND (SELECT RAISE(ROLLBACK, 'Trigger callback failed')
             WHERE NOT EXISTS (SELECT 1 FROM __pocketsync_changes WHERE id = last_insert_rowid()));
      END;
    ''');

    // DELETE trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_delete_$tableName
      AFTER DELETE ON $tableName
      BEGIN
        INSERT INTO __pocketsync_changes (
          table_name, record_rowid, operation, timestamp, data, version
        ) VALUES (
          '$tableName',
          OLD.ps_global_id,
          'DELETE',
          (strftime('%s', 'now') * 1000),
          json_object(
            'old', json_object(${columns.map((col) => "'$col', OLD.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __pocketsync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __pocketsync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
        
        SELECT changes.*
        FROM __pocketsync_changes changes
        WHERE changes.id = last_insert_rowid()
        AND EXISTS (SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__pocketsync_changes')
        AND (SELECT RAISE(ROLLBACK, 'Trigger callback failed')
             WHERE NOT EXISTS (SELECT 1 FROM __pocketsync_changes WHERE id = last_insert_rowid()));
      END;
    ''');
  }

  String _generateUpdateCondition(List<String> columns) {
    final conditions = columns.map((col) => '''(
          OLD.$col IS NOT NEW.$col OR 
          (OLD.$col IS NULL AND NEW.$col IS NOT NULL) OR 
          (OLD.$col IS NOT NULL AND NEW.$col IS NULL) OR
          (OLD.$col != NEW.$col)
        )''').join(' OR ');

    return "($conditions)";
  }

  /// Private method to handle change notifications
  Future<void> _notifyChanges(Iterable<String> tables) async {
    // Get all recent changes from the change
    if (tables.isNotEmpty) {
      for (final table in tables) {
        _changeManager.notifyChange(table);
      }
    }
    _changeManager.notifySync();
  }

  /// Generates a new ps_global_id
  Future<String> _generatePsGlobalId() async {
    final result = await _db!.rawQuery('SELECT hex(randomblob(16)) as uuid');
    return result.first['uuid'] as String;
  }

  /// Ensures a map of values has a ps_global_id
  Future<Map<String, Object?>> _ensurePsGlobalId(
      Map<String, Object?> values) async {
    if (!values.containsKey('ps_global_id')) {
      values['ps_global_id'] = await _generatePsGlobalId();
    }
    return values;
  }
}

/// Wrapper for Batch to handle ps_global_id generation
class _PocketSyncBatch implements Batch {
  final Batch _batch;

  _PocketSyncBatch(this._batch);

  final Set<String> _affectedTables = {};

  @override
  Future<List<Object?>> commit({
    bool? exclusive,
    bool? noResult,
    bool? continueOnError,
  }) async {
    return _batch.commit(
      exclusive: exclusive,
      noResult: noResult,
      continueOnError: continueOnError,
    );
  }

  @override
  void insert(
    String table,
    Map<String, Object?> values, {
    String? nullColumnHack,
    ConflictAlgorithm? conflictAlgorithm,
  }) {
    // Generate ps_global_id synchronously for batch operations
    if (!values.containsKey('ps_global_id')) {
      values = Map.of(values);
      values['ps_global_id'] =
          'ps_${DateTime.now().microsecondsSinceEpoch}_${values.hashCode}';
    }
    _batch.insert(
      table,
      values,
      nullColumnHack: nullColumnHack,
      conflictAlgorithm: conflictAlgorithm,
    );

    _affectedTables.add(table);
  }

  @override
  void rawInsert(String sql, [List<Object?>? arguments]) {
    if (!sql.toLowerCase().contains('ps_global_id')) {
      // Generate ps_global_id synchronously for batch operations
      final psGlobalId =
          'ps_${DateTime.now().microsecondsSinceEpoch}_${sql.hashCode}';
      sql = sql.replaceFirst(')', ', ps_global_id)');
      sql = sql.replaceFirst('?)', '?, ?)');
      arguments = (arguments ?? [])..add(psGlobalId);
    }
    _batch.rawInsert(sql, arguments);

    // Extract affected tables from the SQL statement
    final tables = extractAffectedTables(sql);
    _affectedTables.addAll(tables);
  }

  // Forward other Batch methods to _batch
  @override
  void delete(String table, {String? where, List<Object?>? whereArgs}) {
    _batch.delete(table, where: where, whereArgs: whereArgs);
    _affectedTables.add(table);
  }

  @override
  void execute(String sql, [List<Object?>? arguments]) {
    _batch.execute(sql, arguments);
  }

  @override
  void query(String table,
          {bool? distinct,
          List<String>? columns,
          String? where,
          List<Object?>? whereArgs,
          String? groupBy,
          String? having,
          String? orderBy,
          int? limit,
          int? offset}) =>
      _batch.query(
        table,
        distinct: distinct,
        columns: columns,
        where: where,
        whereArgs: whereArgs,
        groupBy: groupBy,
        having: having,
        orderBy: orderBy,
        limit: limit,
        offset: offset,
      );

  @override
  void rawQuery(String sql, [List<Object?>? arguments]) =>
      _batch.rawQuery(sql, arguments);

  @override
  void update(String table, Map<String, Object?> values,
      {String? where,
      List<Object?>? whereArgs,
      ConflictAlgorithm? conflictAlgorithm}) {
    _batch.update(
      table,
      values,
      where: where,
      whereArgs: whereArgs,
      conflictAlgorithm: conflictAlgorithm,
    );

    _affectedTables.add(table);
  }

  @override
  Future<List<Object?>> apply({bool? noResult, bool? continueOnError}) {
    return _batch.apply(noResult: noResult, continueOnError: continueOnError);
  }

  @override
  int get length => _batch.length;

  @override
  void rawDelete(String sql, [List<Object?>? arguments]) =>
      _batch.rawDelete(sql, arguments);

  @override
  void rawUpdate(String sql, [List<Object?>? arguments]) =>
      _batch.rawUpdate(sql, arguments);
}

extension WatchExtension on PocketSyncDatabase {
  static final Map<PocketSyncDatabase, Map<String, List<QueryWatcher>>>
      _watchersByDb = {};
  static final Map<PocketSyncDatabase, Timer?> _debounceTimers = {};
  static const _debounceMs = 50;

  Map<String, List<QueryWatcher>> get _watchers =>
      _watchersByDb.putIfAbsent(this, () => {});

  Timer? get _debounceTimer => _debounceTimers[this];
  set _debounceTimer(Timer? timer) => _debounceTimers[this] = timer;

  Set<String> _extractTablesFromSql(String sql) {
    final tables = <String>{};
    final regex = RegExp(r'(?:(?:FROM|JOIN|UPDATE|DELETE|INTO|TABLE)\s+)(\w+)',
        caseSensitive: false);
    for (final match in regex.allMatches(sql)) {
      tables.add(match.group(1)!);
    }
    return tables;
  }

  Stream<List<Map<String, dynamic>>> watch(
    String sql, [
    List<Object?>? arguments,
  ]) {
    final queryKey = '$sql${arguments?.toString() ?? ''}';
    final tables = _extractTablesFromSql(sql);
    final watcher = QueryWatcher(sql, arguments, tables);
    _watchers.putIfAbsent(queryKey, () => []).add(watcher);

    // Initial query
    watcher.notify(this);

    // Set up change listeners for relevant tables
    void handleChange(String table, bool isRemote) {
      if (tables.contains(table)) {
        _debounceTimer?.cancel();
        _debounceTimer = Timer(const Duration(milliseconds: _debounceMs), () {
          watcher.notify(this);
        });
      }
    }

    // Add listeners for each table
    for (final table in tables) {
      _changeManager.addTableListener(table, handleChange);
    }

    return watcher.stream.transform(
      StreamTransformer.fromHandlers(
        handleDone: (sink) {
          // Remove table listeners
          for (final table in tables) {
            _changeManager.removeTableListener(table, handleChange);
          }

          // Remove watcher
          final watchers = _watchers[queryKey];
          if (watchers != null) {
            watchers.remove(watcher);
            if (watchers.isEmpty) {
              _watchers.remove(queryKey);
            }
          }

          if (_watchers.isEmpty) {
            _debounceTimer?.cancel();
            _debounceTimer = null;
            _watchersByDb.remove(this);
            _debounceTimers.remove(this);
          }

          watcher.dispose();
          sink.close();
        },
      ),
    );
  }
}
