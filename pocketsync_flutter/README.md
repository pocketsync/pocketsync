# **PocketSync**  

PocketSync makes it easy to sync data across devices without managing a backend. Just use an SQLite database, and PocketSync handles the rest.  

### **🚀 Status: Early Alpha**  
⚠️ **Note:** The API is subject to change as we refine the service.  

## **✨ Features**  
- 🔄 **Automatic Sync** – Changes in your SQLite database sync seamlessly across devices.  
- 📡 **Offline Support** – Changes are queued and synced when the device reconnects.  
- ⚖️ **Last Write Wins** – Simple conflict resolution ensures predictable data handling.  
- 🛠 **Zero Backend Setup** – No need to build or manage a backend—PocketSync does it for you.  

### **⚠️ Known Limitations**  
- Using **integers as primary keys** may cause unexpected behavior. Consider using UUIDs.  
- The SDK is in early alpha, so breaking changes may occur.  

---

## **📦 Installation**  
Install the SDK with:  

```sh
flutter pub add pocketsync_flutter
```  

---

## **🚀 Getting Started**  

### **1️⃣ Set Up Your Project in PocketSync**  
First, create a project in the PocketSync console: [**pocketsync.dev**](https://pocketsync.dev)  

Once your project is created, get your **Project ID** and **Auth Token** from the console.  

### **2️⃣ Initialize the SDK in Your App**  

```dart
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:path/path.dart';

void main() async {
  // Get database path
  String path = join(await getDatabasesPath(), 'todo_database.db');

  // Initialize PocketSync
  await PocketSync.instance.initialize(
    dbPath: path,
    options: PocketSyncOptions(
      projectId: 'your-project-id',
      authToken: 'your-auth-token',
      serverUrl: 'https://api.pocketsync.dev',
    ),
    databaseOptions: DatabaseOptions(
      onCreate: (db, version) async {
        await db.execute(
          'CREATE TABLE todos(id TEXT PRIMARY KEY, title TEXT, isCompleted INTEGER)',
        );
      },
    ),
  );

  // Set user ID (see next section for authentication)
  await PocketSync.instance.setUserId(userId: 'test-user');

  // Start syncing
  await PocketSync.instance.startSync();
}
```  

---

## **🔑 User Authentication**  
PocketSync **does not handle authentication**. You must provide a unique user ID (e.g., from Firebase, Supabase, or your own system).  

```dart
await PocketSync.instance.setUserId(userId: 'user-id');
```

---

## **🔄 Synchronization Control**  

### **Start Syncing**  
```dart
await PocketSync.instance.startSync();
```  

### **Pause & Resume Sync**  
```dart
// Pause synchronization
await PocketSync.instance.pauseSync();

// Resume synchronization
await PocketSync.instance.resumeSync();
```  

### **Cleanup**  
```dart
await PocketSync.instance.dispose();
```  

---

## **📋 Database Operations**  

Since PocketSync works **directly with SQLite**, use `PocketSync.instance.database` for CRUD operations:  

> PocketSyncDatabase is built on top of [sqflite](https://pub.dev/packages/sqflite) which means you can deal with the database in the same way you would if using sqflite.

```dart
final db = PocketSync.instance.database;

// Insert a new record
await db.insert('todos', {
  'id': 'uuid',
  'title': 'Buy groceries',
  'isCompleted': 0,
});

// Update an existing record
await db.update(
  'todos',
  {'isCompleted': 1},
  where: 'id = ?',
  whereArgs: ['uuid'],
);

// Delete a record
await db.delete(
  'todos',
  where: 'id = ?',
  whereArgs: ['uuid'],
);
```  

---

## **⚖️ Custom Conflict Resolution**  
By default, **PocketSync uses "Last Write Wins"**, but you can implement custom conflict resolution:  

```dart
class MyCustomConflictResolver extends ConflictResolver {
  @override
  Future<Map<String, dynamic>> resolveConflict(
    String tableName,
    Map<String, dynamic> localData,
    Map<String, dynamic> remoteData,
  ) async {
    // Custom merge logic
    return remoteData; // Or return a merged version
  }
}
```  

---

## **📚 Full Documentation**  
For advanced features and API details, visit: [**docs.pocketsync.dev**](https://docs.pocketsync.dev)  

---

## **📜 License**  
This project is licensed under the **MIT License** – see the LICENSE file for details.  

---

### **🛠 Help Improve PocketSync!**  
PocketSync is in early alpha, and your feedback is invaluable. **Report issues, suggest features, or contribute!** 🚀  
