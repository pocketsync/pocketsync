import 'package:sqflite/sqflite.dart';

import '../services/conflict_resolver.dart';

class DeltaSyncOptions {
  final String projectId;
  final String authToken; // Instead of apiKey
  final String serverUrl;
  final ConflictResolver conflictResolver;

  DeltaSyncOptions({
    required this.projectId,
    required this.authToken,
    required this.serverUrl,
    this.conflictResolver = const ConflictResolver(),
  });
}

class DatabaseOptions {
  final OnDatabaseConfigureFn? onConfigure;
  final OnDatabaseCreateFn onCreate;
  final OnDatabaseVersionChangeFn? onUpgrade;
  final OnDatabaseVersionChangeFn? onDowngrade;
  final OnDatabaseOpenFn? onOpen;

  const DatabaseOptions({
    required this.onCreate,
    this.onUpgrade,
    this.onConfigure,
    this.onDowngrade,
    this.onOpen,
  });
}
