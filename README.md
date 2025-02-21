# PocketSync

PocketSync is a lightweight synchronization engine for SQLite databases that enables efficient data syncing across devices, even in offline scenarios. It uses a change tracking mechanism with system tables to record modifications, assigns unique global IDs to rows, and triggers sync operations in real-time or upon reconnection. The server handles conflict resolution, broadcasts changes to connected devices, and optimizes data distribution by cleaning and merging updates. This system ensures data consistency and integrity across distributed SQLite databases with minimal overhead.

## Key Features

- Event-driven synchronization
- Offline support
- Automatic conflict resolution
- Real-time updates via WebSocket
- Efficient change tracking and processing

## How It Works

1. System tables track changes and manage sync state
2. Triggers capture modifications to user-defined tables
3. Unique global IDs ensure consistent row identification
4. Sync operations triggered by mutations or reconnection
5. Server processes changes and handles conflict resolution
6. Changes broadcasted to connected devices in real-time
7. Offline devices receive optimized updates upon reconnection

PocketSync provides a robust solution for maintaining data consistency across multiple devices using SQLite databases, making it suitable for applications requiring seamless synchronization capabilities
## Getting Started

### Installation

1. Add the package to your `pubspec.yaml`:
```yaml
dependencies:
  pocketsync_flutter: ^1.0.0
```

2. Initialize PocketSync in your Flutter app:
```dart
final pocketSync = await PocketSync.instance.initialize(
  options: PocketSyncOptions(
    serverUrl: 'your-server-url',
    projectId: 'your-project-id',
    authToken: 'your-auth-token',
  ),
);
```

### Basic Usage

final database = PocketSync.instance.database;

```dart
// Regular SQLite operations are automatically tracked
await database.insert('users', {
  'name': 'John Doe',
  'email': 'john@example.com'
});

// Changes are automatically synchronized when online
// No additional code needed for sync
```

## Documentation

For detailed documentation about advanced features and configuration options, please refer to the following resources:

- [Architecture](docs/architecture.md)
- [Change Tracking System](docs/diff-extraction.md)
- [Changeset Structure](docs/changeset_structure.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.