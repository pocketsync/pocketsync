import 'package:sqflite/sqflite.dart';

class DeltaSyncDatabase {
  Database? _db;

  /// Opens and initializes the database
  Future<Database> initialize({
    required String dbPath,
    Future<void> Function(Database db)? onCreate,
  }) async {
    _db = await openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, version) async {
        // Let user create their tables first if onCreate is provided
        if (onCreate != null) {
          await onCreate(db);
        }
        // Then set up DeltaSync system tables
        await _initializeDeltaSyncTables(db);
      },
      onOpen: _onOpen,
    );
    return _db!;
  }

  /// Sets up the initial DeltaSync system tables
  Future<void> _initializeDeltaSyncTables(Database db) async {
    // Create change tracking table
    await db.execute('''
      CREATE TABLE _deltasync_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Create version tracking table
    await db.execute('''
      CREATE TABLE _deltasync_version (
        table_name TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0
      )
    ''');
  }

  /// Called when database is opened
  Future<void> _onOpen(Database db) async {
    // Set up triggers for change tracking on all user tables
    await _setupChangeTracking(db);
  }

  /// Sets up change tracking triggers for all user tables
  Future<void> _setupChangeTracking(Database db) async {
    // Get list of user tables (excluding DeltaSync system tables)
    final tables = await db.query('sqlite_master',
        where: "type = 'table' AND name NOT LIKE '_deltasync_%'");

    for (final table in tables) {
      final tableName = table['name'] as String;
      await _createTableTriggers(db, tableName);
    }
  }

  /// Creates triggers for a specific table
  Future<void> _createTableTriggers(Database db, String tableName) async {
    // Insert trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS ${tableName}_insert_trigger
      AFTER INSERT ON $tableName
      BEGIN
        INSERT INTO _deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        )
        SELECT
          '$tableName',
          NEW.id,
          'INSERT',
          strftime('%s', 'now'),
          json_object((
            SELECT group_concat(quote(name) || ', ' || quote(CASE 
              WHEN typeof(NEW.[' || name || ']) = 'text' THEN NEW.[' || name || ']
              WHEN typeof(NEW.[' || name || ']) = 'integer' THEN CAST(NEW.[' || name || '] AS TEXT)
              ELSE NULL
            END))
            FROM pragma_table_info('$tableName')
          )),
          COALESCE(MAX(version), 0) + 1
        FROM _deltasync_changes;
      END;
    ''');

    // Update trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS ${tableName}_update_trigger
      AFTER UPDATE ON $tableName
      BEGIN
        INSERT INTO _deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        )
        SELECT
          '$tableName',
          NEW.id,
          'UPDATE',
          strftime('%s', 'now'),
          json_object((
            SELECT group_concat(quote(name) || ', ' || quote(CASE 
              WHEN typeof(NEW.[' || name || ']) = 'text' THEN NEW.[' || name || ']
              WHEN typeof(NEW.[' || name || ']) = 'integer' THEN CAST(NEW.[' || name || '] AS TEXT)
              ELSE NULL
            END))
            FROM pragma_table_info('$tableName')
          )),
          COALESCE(MAX(version), 0) + 1
        FROM _deltasync_changes;
      END;
    ''');

    // Delete trigger
    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS ${tableName}_delete_trigger
      AFTER DELETE ON $tableName
      BEGIN
        INSERT INTO _deltasync_changes (
          table_name, record_id, operation, timestamp, data, version
        )
        SELECT
          '$tableName',
          OLD.id,
          'DELETE',
          strftime('%s', 'now'),
          json_object((
            SELECT group_concat(quote(name) || ', ' || quote(CASE 
              WHEN typeof(OLD.[' || name || ']) = 'text' THEN OLD.[' || name || ']
              WHEN typeof(OLD.[' || name || ']) = 'integer' THEN CAST(OLD.[' || name || '] AS TEXT)
              ELSE NULL
            END))
            FROM pragma_table_info('$tableName')
          )),
          COALESCE(MAX(version), 0) + 1
        FROM _deltasync_changes;
      END;
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
}
