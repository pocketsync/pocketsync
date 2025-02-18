import 'dart:async';

import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/database/database_change.dart';
import 'package:pocketsync_flutter/src/database/database_change_manager.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

/// PocketSync database service for managing local database operations
/// with the ability to track changes and sync them with a remote server
class PocketSyncDatabase {
  Database? _db;

  final DatabaseChangeManager changeManager = DatabaseChangeManager();

  /// Opens and initializes the database
  Future<Database> initialize({
    required String dbPath,
    required DatabaseOptions options,
  }) async {
    _db = await openDatabase(
      dbPath,
      version: options.version,
      onOpen: options.onOpen,
      onUpgrade: options.onUpgrade,
      onConfigure: options.onConfigure,
      onDowngrade: options.onDowngrade,
      singleInstance: true,
      onCreate: (db, version) async {
        await options.onCreate(db, version);

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

    // INSERT trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_insert_$tableName
      AFTER INSERT ON $tableName
      BEGIN
        UPDATE $tableName SET ps_global_id = (SELECT hex(randomblob(16))) WHERE rowid = NEW.rowid AND ps_global_id IS NULL;
        
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
  Future<void> _notifyChanges() async {
    final changes = await _db!.query(
      '__pocketsync_changes',
      where: 'id = last_insert_rowid()',
    );

    if (changes.isNotEmpty) {
      for (final change in changes) {
        changeManager.notifyChange(PsDatabaseChange.fromMap(change));
      }
    }
  }

  /// Adds a listener for changes to a specific table
  void addTableListener(String table, DatabaseChangeListener listener) {
    changeManager.addTableListener(table, listener);
  }

  /// Removes a table-specific listener
  void removeTableListener(String table, DatabaseChangeListener listener) {
    changeManager.removeTableListener(table, listener);
  }

  /// Adds a listener for all database changes
  void addGlobalListener(DatabaseChangeListener listener) {
    changeManager.addGlobalListener(listener);
  }

  /// Removes a global listener
  void removeGlobalListener(DatabaseChangeListener listener) {
    changeManager.removeGlobalListener(listener);
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
    final result = await _db!.insert(
      table,
      values,
      nullColumnHack: nullColumnHack,
      conflictAlgorithm: conflictAlgorithm,
    );

    await _notifyChanges();

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

    await _notifyChanges();

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

    await _notifyChanges();

    return result;
  }

  /// Executes a raw SQL query with optional arguments
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<List<Map<String, dynamic>>> rawQuery(
    String sql, [
    List<Object?>? arguments,
  ]) async {
    final result = await _db!.rawQuery(sql, arguments);

    // Check if the query modifies data (INSERT, UPDATE, DELETE)
    final normalizedSql = sql.trim().toUpperCase();
    if (normalizedSql.startsWith('INSERT') ||
        normalizedSql.startsWith('UPDATE') ||
        normalizedSql.startsWith('DELETE')) {
      await _notifyChanges();
    }

    return result;
  }

  /// Starts a batch operation
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Batch batch() {
    return _db!.batch();
  }

  /// Commits a batch operation and notifies changes
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<List<Object?>> commitBatch(Batch batch) async {
    final result = await batch.commit();
    await _notifyChanges();
    return result;
  }

  /// Applies a batch operation without reading the results and notifies changes
  ///
  /// Refer to the [sqflite documentation](https://pub.dev/packages/sqflite) for more information
  Future<void> applyBatch(Batch batch) async {
    await batch.apply();
    await _notifyChanges();
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

    await _notifyChanges();

    return result;
  }
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
    final regex = RegExp(r'(?:(?:FROM|JOIN|UPDATE|INTO|TABLE)\s+)(\w+)', caseSensitive: false);
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
