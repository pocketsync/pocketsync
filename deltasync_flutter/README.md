# DeltaSync Flutter

A powerful Flutter package for real-time data synchronization with automatic conflict resolution.

### Status: Early Alpha

#### Key Features
- Real-time bidirectional sync via WebSocket
- Automatic conflict resolution
- Offline-first architecture
- Batch synchronization support
- Automatic retry mechanism

#### Warnings
- Using integers as primary keys may not work as expected
- API is subject to change

## Installation

Add this to your package's `pubspec.yaml` file:

```yaml
dependencies:
  deltasync_flutter: ^0.1.0
```

## Usage

### Initialize DeltaSync

```dart
await DeltaSync.instance.initialize(
  dbPath: 'path/to/db',
  databaseOptions: DatabaseOptions(
    version: 1,
    onCreate: (db) {
      // Create tables logic
    },
    onUpgrade: (db, oldVersion, newVersion) {
      // Upgrade logic
    },
  ),
  options: DeltaSyncOptions(
    projectId: 'project-id',
    projectApiKey: 'projectApiKey',
    serverUrl: 'https://api.example.com',
    // Optional: Custom conflict resolution strategy
    conflictResolver: MyCustomConflictResolver(),
  ),
);
```

### Authenticate User

```dart
await DeltaSync.instance.setUserId(userId: 'user-id');
```

### Start Synchronization

```dart
// Start automatic synchronization
await DeltaSync.instance.startSync();
```

### Manage Sync State

```dart
// Pause synchronization
await DeltaSync.instance.pauseSync();

// Resume synchronization
await DeltaSync.instance.resumeSync();
```

### Database Operations

Use the database instance for your CRUD operations:

```dart
final db = DeltaSync.instance.database;

// Insert
await db.insert('table_name', {
  'id': 'uuid',
  'name': 'John Doe',
});

// Update
await db.update('table_name',
  {'name': 'Jane Doe'},
  where: 'id = ?',
  whereArgs: ['uuid'],
);

// Delete
await db.delete('table_name',
  where: 'id = ?',
  whereArgs: ['uuid'],
);
```

### Cleanup

```dart
await DeltaSync.instance.dispose();
```

## Custom Conflict Resolution

Implement your own conflict resolution strategy by extending `ConflictResolver`:

```dart
class MyCustomConflictResolver extends ConflictResolver {
  @override
  Future<Map<String, dynamic>> resolveConflict(
    String tableName,
    Map<String, dynamic> localData,
    Map<String, dynamic> remoteData,
  ) async {
    // Your conflict resolution logic here
    return remoteData; // or merged data
  }
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.