import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:deltasync_flutter/deltasync_flutter.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import 'views/todo_list_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  String path = join(await getDatabasesPath(), 'todo_database.db');

  await DeltaSync.instance.initialize(
    dbPath: path,
    options: DeltaSyncOptions(
      projectId: '2526af00-ecaa-45c1-a7aa-e1fc1ab1c278',
      projectApiKey: '70700ed8-9c4b-4cb9-beab-50b2e796db1d',
      serverUrl: defaultTargetPlatform == TargetPlatform.android
          ? 'http://10.0.2.2:3000'
          : 'http://127.0.0.1:3000',
    ),
    databaseOptions: DatabaseOptions(
      onCreate: (db, version) async {
        await db.execute(
          'CREATE TABLE todos(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, isCompleted INTEGER)',
        );
      },
    ),
  );

  // Set user ID - In a real app, this would come from your auth system
  await DeltaSync.instance.setUserId(userId: 'test-user');

  // Start syncing
  await DeltaSync.instance.startSync();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Todo App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const TodoListView(),
    );
  }
}
