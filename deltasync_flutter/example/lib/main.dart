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
      projectId: 'b6e648dd-ea26-45e7-aa0c-40238e7b946a',
      projectApiKey: '4785f8da-d559-4b89-a288-7ef7c61aa719',
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
