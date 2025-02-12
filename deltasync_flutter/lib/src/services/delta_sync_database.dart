import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

typedef UpgradeCallback = Future<void> Function(Database db, int oldVersion, int newVersion);

class DeltaSyncDatabase {
  Database? _db;

  /// Opens and initializes the database
  Future<Database> initialize({
    required String dbPath,
    Future<void> Function(Database db)? onCreate,
    UpgradeCallback? onUpgrade,
    int version = 1,
  }) async {
    _db = await openDatabase(
      dbPath,
      version: version,
      onUpgrade: onUpgrade,
      onCreate: (db, version) async {
        if (onCreate != null) {
          await onCreate(db);
        }

        await _initializeDeltaSyncTables(db);
        await _setupChangeTracking(db, version);
      },
    );
    return _db!;
  }

  /// Sets up the initial DeltaSync system tables
  Future<void> _initializeDeltaSyncTables(Database db) async {
    await db.execute('''
      CREATE TABLE __deltasync_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        source TEXT DEFAULT 'local'
      )
    ''');

    await db.execute('''
      CREATE TABLE __deltasync_version (
        table_name TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE __deltasync_device_state (
        device_id TEXT PRIMARY KEY,
        last_sync_timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    final deviceState = await db.query('__deltasync_device_state');
    if (deviceState.isEmpty) {
      final deviceId = const Uuid().v4();
      final now = DateTime.now().millisecondsSinceEpoch;
      await db.insert('__deltasync_device_state', {
        'device_id': deviceId,
        'last_sync_timestamp': now,
        'created_at': now,
        'updated_at': now,
      });
    }
  }

  /// Sets up change tracking triggers for all user tables
  Future<void> _setupChangeTracking(Database db, int version) async {
    final tables = await db.query(
      'sqlite_master',
      where:
          "type = 'table' AND name NOT LIKE '__deltasync_%' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%' AND name NOT LIKE 'ios_%' AND name NOT LIKE '.%' AND name NOT LIKE 'system_%' AND name NOT LIKE 'sys_%'",
    );

    for (final table in tables) {
      final tableName = table['name'] as String;
      await _createTableTriggers(db, version, tableName);
    }
  }

  /// Creates triggers for a specific table
  Future<void> _createTableTriggers(Database db, int schemaVersion, String tableName) async {
    final columns = (await db.rawQuery("SELECT name FROM pragma_table_info(?)", [tableName]))
        .map((row) => row['name'] as String)
        .toList();

    // UPDATE trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_update_$tableName
      AFTER UPDATE ON $tableName
      WHEN ${_generateUpdateCondition(columns)}
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        ) VALUES (
          '$tableName',
          NEW.rowid,
          'UPDATE',
          (strftime('%s', 'now') * 1000),
          json_object(
            'old', json_object(${columns.map((col) => "'$col', OLD.$col").join(', ')}),
            'new', json_object(${columns.map((col) => "'$col', NEW.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __deltasync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __deltasync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
      END;
    ''');

    // INSERT trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_insert_$tableName
      AFTER INSERT ON $tableName
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        ) VALUES (
          '$tableName',
          NEW.rowid,
          'INSERT',
          (strftime('%s', 'now') * 1000),
          json_object(
            'new', json_object(${columns.map((col) => "'$col', NEW.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __deltasync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __deltasync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
      END;
    ''');

    // DELETE trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_delete_$tableName
      AFTER DELETE ON $tableName
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        ) VALUES (
          '$tableName',
          OLD.rowid,
          'DELETE',
          (strftime('%s', 'now') * 1000),
          json_object(
            'old', json_object(${columns.map((col) => "'$col', OLD.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __deltasync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __deltasync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
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

    await _db!.execute('''
      UPDATE sqlite_master 
      SET sql = REPLACE(sql, 'TRIGGER', 'TRIGGER IF NULL')
      WHERE type = 'trigger' 
      AND name IN (
        'after_insert_$tableName',
        'after_update_$tableName',
        'after_delete_$tableName'
      );
    ''');
  }

  /// Enables triggers for a table
  Future<void> enableTriggers(String tableName) async {
    if (_db == null) return;
    await _db!.execute('''
      UPDATE sqlite_master 
      SET sql = REPLACE(sql, 'TRIGGER IF NULL', 'TRIGGER')
      WHERE type = 'trigger' 
      AND name IN (
        'after_insert_$tableName',
        'after_update_$tableName',
        'after_delete_$tableName'
      );
    ''');
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

  /// Inserts a row into the specified table
  Future<int> insert(
    String table,
    Map<String, Object?> values, {
    String? nullColumnHack,
    ConflictAlgorithm? conflictAlgorithm,
  }) async {
    return await _db!.insert(
      table,
      values,
      nullColumnHack: nullColumnHack,
      conflictAlgorithm: conflictAlgorithm,
    );
  }

  /// Updates rows in the specified table
  Future<int> update(
    String table,
    Map<String, Object?> values, {
    String? where,
    List<Object?>? whereArgs,
    ConflictAlgorithm? conflictAlgorithm,
  }) async {
    return await _db!.update(
      table,
      values,
      where: where,
      whereArgs: whereArgs,
      conflictAlgorithm: conflictAlgorithm,
    );
  }

  /// Deletes rows from the specified table
  Future<int> delete(
    String table, {
    String? where,
    List<Object?>? whereArgs,
  }) async {
    return await _db!.delete(
      table,
      where: where,
      whereArgs: whereArgs,
    );
  }

  /// Executes a raw SQL query with optional arguments
  Future<List<Map<String, dynamic>>> rawQuery(
    String sql, [
    List<Object?>? arguments,
  ]) async {
    return await _db!.rawQuery(sql, arguments);
  }

  /// Starts a batch operation
  Batch batch() {
    return _db!.batch();
  }

  /// Commits a batch operation
  Future<List<Object?>> commitBatch(Batch batch) async {
    return await batch.commit();
  }

  /// Applies a batch operation without reading the results
  Future<void> applyBatch(Batch batch) async {
    await batch.apply();
  }
}
