import 'dart:async';
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/database/database_change.dart';
import 'package:pocketsync_flutter/src/database/database_change_manager.dart';
import 'package:pocketsync_flutter/src/services/logger_service.dart';
import 'package:pocketsync_flutter/src/services/pocket_sync_background_service.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

/// PocketSync database service for managing local database operations
/// with the ability to track changes and sync them with a remote server
class PocketSyncDatabase {
  Database? _db;
  PocketSyncBackgroundService? _backgroundService;
  final DatabaseChangeManager changeManager = DatabaseChangeManager();
  final DatabaseOptions _options;
  StreamSubscription? _backgroundServiceSubscription;

  final LoggerService _logger = LoggerService.instance;

  PocketSyncDatabase({
    required DatabaseOptions options,
  }) : _options = options;

  Database? get db => _db;

  /// Sets the background service instance and sets up listeners
  void setBackgroundService(PocketSyncBackgroundService service) {
    _backgroundService = service;
    _setupBackgroundServiceListeners();
  }

  /// Sets up listeners for background service notifications
  void _setupBackgroundServiceListeners() {
    // Cancel any existing subscription
    _backgroundServiceSubscription?.cancel();

    // Listen for changes from background service
    _backgroundServiceSubscription =
        _backgroundService?.service.on('onDatabaseChange').listen((event) {
      if (event == null) return;

      try {
        // Validate required fields
        final tableName = event['tableName'];
        final operation = event['operation'];
        final data = event['data'];
        final recordId = event['recordId'];
        final timestamp = event['timestamp'];

        if (tableName == null ||
            operation == null ||
            data == null ||
            recordId == null ||
            timestamp == null) {
          throw FormatException(
              'Missing required fields in database change notification');
        }

        // Type checking
        if (tableName is! String ||
            operation is! String ||
            data is! Map<String, dynamic> ||
            recordId is! String ||
            timestamp is! int) {
          throw FormatException(
              'Invalid field types in database change notification');
        }

        final change = PsDatabaseChange(
          tableName: tableName,
          operation: operation,
          data: data,
          recordId: recordId,
          timestamp: DateTime.fromMillisecondsSinceEpoch(timestamp),
        );

        // Notify local listeners
        changeManager.notifyChange(change);
      } catch (e, stackTrace) {
        _logger.error(
          'Error processing background service notification',
          error: e,
          stackTrace: stackTrace,
        );
      }
    });
  }

  /// Notifies the background service of database changes
  Future<void> _notifyBackgroundService(PsDatabaseChange change) async {
    try {
      await _backgroundService?.requestSync();
    } catch (e) {
      _logger.error('Failed to notify background service: $e');
    }
  }

  /// Extends change manager notification to include background service
  void notifyChange(PsDatabaseChange change) {
    changeManager.notifyChange(change);
    _notifyBackgroundService(change);
  }

  /// Disposes of the database resources
  Future<void> dispose() async {
    await _backgroundServiceSubscription?.cancel();
    await _db?.close();
  }

  /// Opens and initializes the database
  Future<Database> initialize({
    required String dbPath,
  }) async {
    _db = await openDatabase(
      dbPath,
      version: _options.version,
      onOpen: _options.onOpen,
      onUpgrade: _options.onUpgrade,
      onConfigure: _options.onConfigure,
      onDowngrade: _options.onDowngrade,
      singleInstance: true,
      onCreate: (db, version) async {
        await _options.onCreate(db, version);
        await _initializePocketSyncTables(db);
        await _setupChangeTracking(db, version);
      },
    );

    return _db!;
  }

  /// Sets up the initial PocketSync system tables
  Future<void> _initializePocketSyncTables(Database db) async {
    await db.execute('''
      CREATE TABLE __pocketsync_changes (
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
      CREATE TABLE __pocketsync_version (
        table_name TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE __pocketsync_device_state (
        device_id TEXT PRIMARY KEY,
        last_sync_timestamp INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE __pocketsync_processed_changes (
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

    final deviceState = await db.query('__pocketsync_device_state');
    if (deviceState.isEmpty) {
      final deviceId = const Uuid().v4();
      final now = DateTime.now().millisecondsSinceEpoch;
      await db.insert('__pocketsync_device_state', {
        'device_id': deviceId,
        'last_sync_timestamp': now,
      });
    }
  }

  /// Sets up change tracking triggers for all user tables
  Future<void> _setupChangeTracking(Database db, int version) async {
    final tables = await db.query(
      'sqlite_master',
      where:
          "type = 'table' AND name NOT LIKE '__pocketsync_%' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%' AND name NOT LIKE 'ios_%' AND name NOT LIKE '.%' AND name NOT LIKE 'system_%' AND name NOT LIKE 'sys_%'",
    );

    for (final table in tables) {
      final tableName = table['name'] as String;

      // Add ps_global_id column to user tables
      await db.execute('''
        ALTER TABLE $tableName ADD COLUMN ps_global_id TEXT NULL;
        CREATE INDEX idx_${tableName}_ps_global_id ON $tableName(ps_global_id);
      ''');

      await _createTableTriggers(db, version, tableName);
    }
  }

  /// Creates triggers for a specific table
  Future<void> _createTableTriggers(
      Database db, int schemaVersion, String tableName) async {
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

  /// Closes the database
  Future<void> close() async {
    changeManager.dispose();
    await _db?.close();
    _db = null;
  }

  /// Executes a raw SQL query
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
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

  /// Private method to handle change notifications
  Future<void> notifyChanges() async {
    // Get all recent changes from the changes table
    final changes = await _db!.query(
      '__pocketsync_changes',
      where:
          'id IN (SELECT id FROM __pocketsync_changes ORDER BY id DESC LIMIT 100)',
      orderBy: 'id ASC',
    );

    if (changes.isNotEmpty) {
      for (final change in changes) {
        changeManager.notifyChange(PsDatabaseChange.fromJson(change));
      }
    }
  }

  /// Adds a listener for changes to a specific table
  void addTableListener(String table, DatabaseChangeListener listener) =>
      changeManager.addTableListener(table, listener);

  /// Removes a table-specific listener
  void removeTableListener(String table, DatabaseChangeListener listener) =>
      changeManager.removeTableListener(table, listener);

  /// Adds a listener for all database changes
  void addGlobalListener(DatabaseChangeListener listener) =>
      changeManager.addGlobalListener(listener);

  /// Removes a global listener
  void removeGlobalListener(DatabaseChangeListener listener) =>
      changeManager.removeGlobalListener(listener);

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

  /// Inserts a row into the specified table
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
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

    await notifyChanges();

    return result;
  }

  /// Updates rows in the specified table
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
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

    await notifyChanges();

    return result;
  }

  /// Deletes rows from the specified table
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
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

    await notifyChanges();

    return result;
  }

  /// Executes a raw SQL query with optional arguments
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<List<Map<String, dynamic>>> rawQuery(
    String sql, [
    List<Object?>? arguments,
  ]) async {
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
      await notifyChanges();
    }

    return result;
  }

  /// Starts a batch operation
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Batch batch() {
    final batch = _db!.batch();
    return _PocketSyncBatch(batch);
  }

  /// Commits a batch operation and notifies changes
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<List<Object?>> commitBatch(Batch batch) async {
    final result = await batch.commit();
    await notifyChanges();
    return result;
  }

  /// Applies a batch operation without reading the results and notifies changes
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<void> applyBatch(Batch batch) async {
    await batch.apply();
    await notifyChanges();
  }

  /// Executes a transaction
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<T> transaction<T>(Future<T> Function(Transaction txn) action) async {
    final result = await _db!.transaction((txn) async {
      try {
        return await action(txn);
      } catch (e) {
        rethrow;
      }
    });

    await notifyChanges();

    return result;
  }
}

/// Wrapper for Batch to handle ps_global_id generation
class _PocketSyncBatch implements Batch {
  final Batch _batch;

  _PocketSyncBatch(this._batch);

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
  }

  // Forward other Batch methods to _batch
  @override
  void delete(String table, {String? where, List<Object?>? whereArgs}) =>
      _batch.delete(table, where: where, whereArgs: whereArgs);

  @override
  void execute(String sql, [List<Object?>? arguments]) =>
      _batch.execute(sql, arguments);

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
          ConflictAlgorithm? conflictAlgorithm}) =>
      _batch.update(
        table,
        values,
        where: where,
        whereArgs: whereArgs,
        conflictAlgorithm: conflictAlgorithm,
      );

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

class QueryWatcher {
  final String sql;
  final List<Object?>? arguments;
  final StreamController<List<Map<String, dynamic>>> _controller;
  final Set<String> tables;
  bool _isActive = true;

  QueryWatcher(this.sql, this.arguments, this.tables)
      : _controller = StreamController<List<Map<String, dynamic>>>.broadcast();

  Stream<List<Map<String, dynamic>>> get stream => _controller.stream;

  void dispose() {
    _isActive = false;
    _controller.close();
  }

  Future<void> notify(PocketSyncDatabase db) async {
    if (!_isActive) return;

    try {
      final results = await db.rawQuery(sql, arguments);
      if (!_isActive) return;
      _controller.add(results);
    } catch (e) {
      if (!_isActive) return;
      _controller.addError(e);
    }
  }
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
    void handleChange(PsDatabaseChange change) {
      if (tables.contains(change.tableName)) {
        _debounceTimer?.cancel();
        _debounceTimer = Timer(const Duration(milliseconds: _debounceMs), () {
          watcher.notify(this);
        });
      }
    }

    // Add listeners for each table
    for (final table in tables) {
      changeManager.addTableListener(table, handleChange);
    }

    return watcher.stream.transform(
      StreamTransformer.fromHandlers(
        handleDone: (sink) {
          // Remove table listeners
          for (final table in tables) {
            changeManager.removeTableListener(table, handleChange);
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
