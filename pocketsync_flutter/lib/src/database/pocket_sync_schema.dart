import 'package:sqflite/sqflite.dart';

/// Handles database schema creation and updates for PocketSync
class PocketSyncSchema {
  /// Creates all required PocketSync tables
  static Future<void> createTables(Database db, int version) async {
    // Create changes tracking table
    await db.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_rowid INTEGER NOT NULL,
        operation TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Create device state table
    await db.execute('''
      CREATE TABLE IF NOT EXISTS __pocketsync_device_state (
        device_id TEXT PRIMARY KEY
      )
    ''');
  }
}
