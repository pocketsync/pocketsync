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
    syncInterval: const Duration(seconds: 3),
    options: DeltaSyncOptions(
      projectId: '88e909f9-17ee-4b81-a547-47395ea72bb7',
      projectApiKey: '5bfb9848-d4a6-46aa-ad4c-3880129aa05c',
      serverUrl: defaultTargetPlatform == TargetPlatform.android ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000',
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
