/// Monitors and logs performance metrics for PocketSync operations
class SyncPerformanceMonitor {
  static final SyncPerformanceMonitor _instance =
      SyncPerformanceMonitor._internal();
  factory SyncPerformanceMonitor() => _instance;
  SyncPerformanceMonitor._internal();

  final _metrics = <String, List<Duration>>{};
  final _operations = <String, Stopwatch>{};

  /// Start timing an operation
  void startOperation(String operationName) {
    final stopwatch = Stopwatch()..start();
    _operations[operationName] = stopwatch;
  }

  /// End timing an operation and record its duration
  void endOperation(String operationName) {
    final stopwatch = _operations.remove(operationName);
    if (stopwatch != null) {
      stopwatch.stop();
      _metrics.putIfAbsent(operationName, () => []).add(stopwatch.elapsed);
    }
  }

  /// Get average duration for an operation
  Duration getAverageDuration(String operationName) {
    final durations = _metrics[operationName];
    if (durations == null || durations.isEmpty) return Duration.zero;

    final total = durations.fold<Duration>(
      Duration.zero,
      (prev, curr) =>
          Duration(microseconds: prev.inMicroseconds + curr.inMicroseconds),
    );
    return Duration(microseconds: total.inMicroseconds ~/ durations.length);
  }

  /// Get performance report for all operations
  Map<String, String> getPerformanceReport() {
    final report = <String, String>{};
    for (final entry in _metrics.entries) {
      final avg = getAverageDuration(entry.key);
      final min = entry.value.reduce((a, b) => a < b ? a : b);
      final max = entry.value.reduce((a, b) => a > b ? a : b);
      report[entry.key] = 'Avg: ${avg.inMilliseconds}ms, '
          'Min: ${min.inMilliseconds}ms, '
          'Max: ${max.inMilliseconds}ms, '
          'Count: ${entry.value.length}';
    }
    return report;
  }

  /// Clear all metrics
  void reset() {
    _metrics.clear();
    _operations.clear();
  }
}
