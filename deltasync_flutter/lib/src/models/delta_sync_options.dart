import '../services/conflict_resolver.dart';

class DeltaSyncOptions {
  final String projectId;
  final String projectApiKey;
  final String serverUrl;
  final ConflictResolver conflictResolver;

  const DeltaSyncOptions({
    required this.projectId,
    required this.projectApiKey,
    required this.serverUrl,
    this.conflictResolver = const ConflictResolver(),
  });
}