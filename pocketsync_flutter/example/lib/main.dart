import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:path/path.dart';
import 'views/todo_list_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  String path = join(await getDatabasesPath(), 'todo_database.db');

  await PocketSync.instance.initialize(
    dbPath: path,
    options: PocketSyncOptions(
      projectId: 'ecd550f6-4ee3-4027-92db-63e218bb75f8',
      authToken: 'ds_YzcwMmFlMzQ5N2RmNDdiNjk4OTFlNGI4MWI1MTYwMTE=',
      serverUrl: defaultTargetPlatform == TargetPlatform.android ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000',
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
  await PocketSync.instance.setUserId(userId: 'test-user');

  // Start syncing
  await PocketSync.instance.startSync();

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
