/// Defines how conflicts should be resolved when remote and local changes conflict
enum ConflictResolutionStrategy {
  /// Ignore conflicts and apply remote changes
  ignore,

  /// Use server changes in case of conflict
  serverWins,

  /// Keep local changes in case of conflict
  clientWins,

  /// Use custom resolution strategy
  custom
}

/// Handles conflict resolution between local and remote changes
class ConflictResolver {
  final ConflictResolutionStrategy strategy;
  final Future<Map<String, dynamic>> Function(
      String tableName,
      Map<String, dynamic> localRow,
      Map<String, dynamic> remoteRow)? customResolver;

  const ConflictResolver({
    this.strategy = ConflictResolutionStrategy.ignore,
    this.customResolver,
  }) : assert(
          strategy != ConflictResolutionStrategy.custom ||
              customResolver != null,
          'Custom resolver must be provided when using custom strategy',
        );

  /// Resolves conflicts between local and remote row data
  Future<Map<String, dynamic>> resolveConflict(String tableName,
      Map<String, dynamic> localRow, Map<String, dynamic> remoteRow) async {
    switch (strategy) {
      case ConflictResolutionStrategy.ignore:
      case ConflictResolutionStrategy.serverWins:
        return remoteRow;
      case ConflictResolutionStrategy.clientWins:
        return localRow;
      case ConflictResolutionStrategy.custom:
        if (customResolver != null) {
          return await customResolver!(tableName, localRow, remoteRow);
        }
        throw Exception('Custom resolver not provided');
    }
  }
}
