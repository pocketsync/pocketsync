import 'package:sqflite/sqflite.dart';
import 'package:sqlite3/sqlite3.dart' as sq3;
import 'package:path/path.dart';
import '../models/todo.dart';

class TodoController {
  static sq3.Database? _database;
  static bool _closing = false;

  Future<sq3.Database> get database async {
    if (_closing) {
      throw StateError('Database is being closed');
    }
    if (_database == null) {
      return await _initDatabase();
    }
    return _database!;
  }

  Future<sq3.Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), 'todo_database.db');
    // return await openDsqatabase(
    //   path,
    //   version: 1,
    //   onCreate: (Database db, int version) async {
    //     await db.execute('CREATE TABLE todos(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, isCompleted INTEGER)');
    //   },
    // );
    return sq3.sqlite3.open(path);
  }

  Future<void> insertTodo(Todo todo) async {
    final db = await database;
    db.execute('INSERT OR REPLACE INTO todos (id, title, isCompleted) VALUES (?, ?, ?)',
        [todo.id, todo.title, todo.isCompleted ? 1 : 0]);
  }

  Future<List<Todo>> getTodos() async {
    final db = await database;
    final results = db.select('SELECT * FROM todos');
    return results
        .map((row) => Todo.fromMap({'id': row['id'], 'title': row['title'], 'isCompleted': row['isCompleted']}))
        .toList();
  }

  Future<void> updateTodo(Todo todo) async {
    final db = await database;
    db.execute(
        'UPDATE todos SET title = ?, isCompleted = ? WHERE id = ?', [todo.title, todo.isCompleted ? 1 : 0, todo.id]);
  }

  Future<void> deleteTodo(int id) async {
    final db = await database;
    db.execute('DELETE FROM todos WHERE id = ?', [id]);
  }

  Future<void> dispose() async {
    _closing = true;
    if (_database != null) {
      _database!.dispose();
      _database = null;
    }
    _closing = false;
  }
}
