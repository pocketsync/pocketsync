# DeltaSync Flutter

Usage:
```dart
await DeltaSync.instance.initialize(
  dbPath: 'path/to/db',
  syncInterval: Duration(seconds: 15),
  options: DeltaSyncOptions(
    projectId: 'project-id',
    projectApiKey: 'projectApiKey',
    serverUrl: 'https://api.example.com',
  ),
);
````

Authenticate the app user:
```dart
await DeltaSync.instance.setUserId(userId: 'user-id');
```

Start sync:
```dart
await DeltaSync.instance.startSync();
```

Pause and resume sync:
```dart
await DeltaSync.instance.pauseSync();
await DeltaSync.instance.resumeSync();
````

Cleanup:
```dart
await DeltaSync.instance.dispose();
```