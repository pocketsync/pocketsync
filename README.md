# PocketSync

PocketSync is a robust, real-time database synchronization solution designed for Flutter applications that require seamless offline-first data synchronization capabilities. It enables automatic change tracking, conflict resolution, and efficient data synchronization between multiple devices through a centralized server.

## Features

- **Automatic Change Tracking**: Uses SQLite triggers to detect and record all database modifications automatically
- **Real-time Synchronization**: Maintains data consistency across devices with real-time updates
- **Offline-First Architecture**: Continues to work seamlessly during network interruptions
- **Conflict Resolution**: Built-in conflict resolution system for handling concurrent modifications
- **Efficient Delta Extraction**: Only synchronizes changed data, minimizing network usage
- **Cross-Platform Support**: Works on all platforms supported by Flutter

## Architecture

PocketSync consists of three main components:

1. **Flutter Client Library** (`pocketsync_flutter`)
   - Handles local database operations
   - Tracks changes using SQLite triggers
   - Manages synchronization with the server

2. **Backend Server** (`pocketsync-backend`)
   - Processes and distributes changes between devices
   - Handles conflict resolution
   - Manages device state and synchronization

3. **Web Interface** (`pocketsync-web`)
   - Provides a web-based management interface
   - Monitors synchronization status
   - Manages user accounts and permissions

## How It Works

1. **Database Initialization**
   - Sets up system tables for change tracking
   - Creates triggers for automatic change detection
   - Initializes device-specific sync state

2. **Change Detection & Recording**
   - Automatically captures INSERT, UPDATE, and DELETE operations
   - Records full data payloads for each change
   - Maintains version numbers for conflict detection

3. **Synchronization Process**
   - Extracts changes since last sync
   - Sends changes to server for processing
   - Applies remote changes locally
   - Resolves conflicts using configurable strategies

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

- [Change Tracking System](docs/diff-extraction.md)
- [Changeset Structure](docs/changeset_structure.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.