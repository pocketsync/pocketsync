import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

class PocketSyncDatabase {
  Database? _db;
  Function(List<Map<String, dynamic>>)? onChangesAdded;

  /// Opens and initializes the database
  Future<Database> initialize({
    required String dbPath,
    required DatabaseOptions options,
    int version = 1,
  }) async {
    _db = await openDatabase(
      dbPath,
      version: version,
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
        record_rowid INTEGER NOT NULL,
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
          NEW.rowid,
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
        INSERT INTO __pocketsync_changes (
          table_name, record_rowid, operation, timestamp, data, version
        ) VALUES (
          '$tableName',
          NEW.rowid,
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
          OLD.rowid,
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

  /// Disables triggers for a table
  Future<void> disableTriggers(String tableName) async {
    if (_db == null) return;

    // Store original trigger definitions before dropping
    final triggers = await _db!.query(
      'sqlite_master',
      where: "type = 'trigger' AND tbl_name = ? AND name IN (?, ?, ?)",
      whereArgs: [
        tableName,
        'after_insert_$tableName',
        'after_update_$tableName',
        'after_delete_$tableName'
      ],
    );

    // Drop existing triggers
    for (final trigger in triggers) {
      final triggerName = trigger['name'] as String;
      await _db!.execute('DROP TRIGGER IF EXISTS $triggerName');
    }

    // Store trigger definitions for later recreation
    await _db!.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_trigger_backup (
        table_name TEXT NOT NULL,
        trigger_name TEXT NOT NULL,
        trigger_sql TEXT NOT NULL,
        PRIMARY KEY (table_name, trigger_name)
      )
    ''');

    final batch = _db!.batch();
    for (final trigger in triggers) {
      batch.insert(
          '__pocketsync_trigger_backup',
          {
            'table_name': tableName,
            'trigger_name': trigger['name'],
            'trigger_sql': trigger['sql'],
          },
          conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit();
  }

  /// Enables triggers for a table
  Future<void> enableTriggers(String tableName) async {
    if (_db == null) return;

    // Get stored trigger definitions
    final triggers = await _db!.query(
      '__pocketsync_trigger_backup',
      where: 'table_name = ?',
      whereArgs: [tableName],
    );

    // Recreate triggers
    for (final trigger in triggers) {
      await _db!.execute(trigger['trigger_sql'] as String);
    }

    // Clean up backup for this table
    await _db!.delete(
      '__pocketsync_trigger_backup',
      where: 'table_name = ?',
      whereArgs: [tableName],
    );
  }

  /// Closes the database
  Future<void> close() async {
    await _db?.close();
    _db = null;
  }

  /// Executes a raw SQL query
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
    if (onChangesAdded != null) {
      final changes = await _db!.query(
        '__pocketsync_changes',
        where: 'id = last_insert_rowid()',
      );
      if (changes.isNotEmpty) {
        onChangesAdded!(changes);
      }
    }
  }

  /// Inserts a row into the specified table
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
  Batch batch() {
    return _db!.batch();
  }

  /// Commits a batch operation and notifies changes
  Future<List<Object?>> commitBatch(Batch batch) async {
    final result = await batch.commit();
    await _notifyChanges();
    return result;
  }

  /// Applies a batch operation without reading the results and notifies changes
  Future<void> applyBatch(Batch batch) async {
    await batch.apply();
    await _notifyChanges();
  }

  /// Executes a transaction
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
