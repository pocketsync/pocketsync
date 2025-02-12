import 'package:deltasync_flutter/deltasync_flutter.dart';
import '../models/todo.dart';

class TodoController {
  final DeltaSyncDatabase db;

  TodoController(this.db);

  Future<void> insertTodo(Todo todo) async {
    db.rawQuery(
      'INSERT OR REPLACE INTO todos (id, title, isCompleted) VALUES (?, ?, ?)',
      [todo.id, todo.title, todo.isCompleted ? 1 : 0],
    );
  }

  Future<List<Todo>> getTodos() async {
    final results = await db.rawQuery('SELECT * FROM todos');
    return results
        .map((row) => Todo.fromMap({
              'id': row['id'],
              'title': row['title'],
              'isCompleted': row['isCompleted']
            }))
        .toList();
  }

  Future<void> updateTodo(Todo todo) async {
    await db.rawQuery(
      'UPDATE todos SET title = ?, isCompleted = ? WHERE id = ?',
      [todo.title, todo.isCompleted ? 1 : 0, todo.id],
    );
  }

  Future<void> deleteTodo(int id) async {
    await db.rawQuery('DELETE FROM todos WHERE id = ?', [id]);
  }
}
