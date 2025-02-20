import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:sqflite/sqflite.dart';

/// Options for configuring PocketSync
/// [projectId] - The project ID for the PocketSync project. This can be found in the PocketSync dashboard.
/// [authToken] - The auth token for the PocketSync project. This can be found in the PocketSync dashboard.
/// [serverUrl] - The URL of the PocketSync server. Default value is 'https://api.pocketsync.dev'.
/// [conflictResolver] - The conflict resolver to use when local and remote changes conflict. By default, conflicts are ignored and remote changes are applied.
class PocketSyncOptions {
  /// The project ID for the PocketSync project. This can be found in the PocketSync dashboard.
  /// This is required.
  final String projectId;

  /// The auth token for the PocketSync project. This can be found in the PocketSync dashboard.
  final String authToken;

  /// The URL of the PocketSync server. This is required.
  /// Default value is 'https://api.pocketsync.dev'.
  final String serverUrl;

  /// The conflict resolver to use when local and remote changes conflict.
  /// By default, conflicts are ignored and remote changes are applied.
  final ConflictResolver conflictResolver;

  PocketSyncOptions({
    required this.projectId,
    required this.authToken,
    this.serverUrl = 'https://api.pocketsync.dev',
    this.conflictResolver = const ConflictResolver(),
  });
}

class DatabaseOptions {
  final int version;
  final OnDatabaseConfigureFn? onConfigure;
  final OnDatabaseCreateFn onCreate;
  final OnDatabaseVersionChangeFn? onUpgrade;
  final OnDatabaseVersionChangeFn? onDowngrade;
  final OnDatabaseOpenFn? onOpen;

  const DatabaseOptions({
    this.version = 1,
    required this.onCreate,
    this.onUpgrade,
    this.onConfigure,
    this.onDowngrade,
    this.onOpen,
  });
}
