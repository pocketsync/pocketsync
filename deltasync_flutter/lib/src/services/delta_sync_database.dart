import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

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
        // Finally set up change tracking triggers
        await _setupChangeTracking(db, version);
      },
    );
    return _db!;
  }

  /// Sets up the initial DeltaSync system tables
  Future<void> _initializeDeltaSyncTables(Database db) async {
    // Create change tracking table
    await db.execute('''
      CREATE TABLE __deltasync_changes (
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
      CREATE TABLE __deltasync_version (
        table_name TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Create device state tracking table
    await db.execute('''
      CREATE TABLE __deltasync_device_state (
        device_id TEXT PRIMARY KEY,
        last_sync_timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    // Generate and store device ID if it doesn't exist
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
    // Get list of user tables (excluding all system tables)
    final tables = await db.query('sqlite_master',
        where:
            "type = 'table' AND name NOT LIKE '__deltasync_%' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%' AND name NOT LIKE 'ios_%' AND name NOT LIKE '.%' AND name NOT LIKE 'system_%' AND name NOT LIKE 'sys_%'");

    for (final table in tables) {
      final tableName = table['name'] as String;
      await _createTableTriggers(db, version, tableName);
    }
  }

  /// Creates triggers for a specific table
  Future<void> _createTableTriggers(
      Database db, int schemaVersion, String tableName) async {
    // Get columns for the table
    final columns = (await db
            .rawQuery("SELECT name FROM pragma_table_info(?)", [tableName]))
        .map((row) => row['name'] as String)
        .toList();

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
            'old', json_object(${columns.where((col) => col != 'last_modified').map((col) => "'$col', OLD.$col").join(', ')}),
            'new', json_object(${columns.where((col) => col != 'last_modified').map((col) => "'$col', NEW.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __deltasync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __deltasync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
        
        UPDATE $tableName 
        SET last_modified = (strftime('%s', 'now') * 1000)
        WHERE rowid = NEW.rowid;
      END;
    ''');

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
            'new', json_object(${columns.where((col) => col != 'last_modified').map((col) => "'$col', NEW.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __deltasync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __deltasync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
        
        UPDATE $tableName 
        SET last_modified = (strftime('%s', 'now') * 1000)
        WHERE rowid = NEW.rowid;
      END;
    ''');

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
            'old', json_object(${columns.where((col) => col != 'last_modified').map((col) => "'$col', OLD.$col").join(', ')})
          ),
          (SELECT COALESCE(MAX(version), 0) + 1 FROM __deltasync_version WHERE table_name = '$tableName')
        );
        
        UPDATE __deltasync_version 
        SET version = version + 1
        WHERE table_name = '$tableName';
      END;
    ''');

    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_insert_$tableName
      AFTER INSERT ON $tableName
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, row_id, operation, timestamp, change_data
        ) VALUES (
          '$tableName',
          NEW.rowid,
          'INSERT',
          (strftime('%s', 'now') * 1000),
          json_object(
            'new', json_object(${await _generateColumnList(tableName, db: db)}),
            'schema_version', $schemaVersion
          )
        );
        UPDATE $tableName SET last_modified = (strftime('%s', 'now') * 1000) 
        WHERE rowid = NEW.rowid;
      END;
    ''');

    await db.execute('''
      CREATE TRIGGER IF NOT EXISTS after_delete_$tableName
      AFTER DELETE ON $tableName
      BEGIN
        INSERT INTO __deltasync_changes (
          table_name, row_id, operation, timestamp, change_data
        ) VALUES (
          '$tableName',
          OLD.rowid,
          'DELETE',
          (strftime('%s', 'now') * 1000),
          json_object(
            'old', json_object(${await _generateColumnList(tableName, prefix: 'OLD', db: db)}),
            'schema_version', $schemaVersion
          )
        );
      END;
    ''');
  }

  Future<String> _generateColumnList(
    String tableName, {
    String prefix = 'NEW',
    required Database db,
  }) async {
    final result = await db
        .rawQuery("SELECT name FROM pragma_table_info(?)", [tableName]);
    final columns = result.map((row) => row['name'] as String).toList();

    return columns.map((col) => "'$col', $prefix.$col").join(', ');
  }

  String _generateUpdateCondition(List<String> columns) {
    final conditions =
        columns.where((col) => col != 'last_modified').map((col) => '''(
          OLD.$col IS NOT NEW.$col OR 
          (OLD.$col IS NULL AND NEW.$col IS NOT NULL) OR 
          (OLD.$col IS NOT NULL AND NEW.$col IS NULL) OR
          (OLD.$col != NEW.$col)
        )''').join(' OR ');

    return "($conditions) AND NOT (NEW.last_modified != OLD.last_modified AND NEW.last_modified = (strftime('%s', 'now') * 1000))";
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
