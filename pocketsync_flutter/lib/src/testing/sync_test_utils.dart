import 'dart:async';
import 'package:pocketsync_flutter/pocketsync_flutter.dart';
import 'package:pocketsync_flutter/src/utils/sync_performance_monitor.dart';

/// Utility class for testing PocketSync functionality
class SyncTestUtils {
  /// Test local to remote sync with performance monitoring
  static Future<void> testLocalToRemoteSync({
    required PocketSync pocketSync,
    required String tableName,
    required List<Map<String, dynamic>> testData,
    required Duration timeout,
  }) async {
    final completer = Completer<void>();
    final monitor = SyncPerformanceMonitor();

    // Start monitoring
    monitor.startOperation('localToRemoteSync');

    try {
      // Insert test data
      for (final data in testData) {
        await pocketSync.database.db?.insert(tableName, data);
      }

      // Wait for sync to complete or timeout
      final timer = Timer(timeout, () {
        if (!completer.isCompleted) {
          completer.completeError(TimeoutException('Sync timeout'));
        }
      });

      // Monitor sync completion
      await completer.future;
      timer.cancel();
    } finally {
      monitor.endOperation('localToRemoteSync');
    }
  }

  /// Test offline mode functionality
  static Future<void> testOfflineMode({
    required PocketSync pocketSync,
    required String tableName,
    required List<Map<String, dynamic>> testData,
    required Duration offlineDuration,
  }) async {
    final monitor = SyncPerformanceMonitor();

    monitor.startOperation('offlineSync');

    try {
      // Simulate offline state
      // This would typically involve disabling network connectivity

      // Make local changes while offline
      for (final data in testData) {
        await pocketSync.database.db?.insert(tableName, data);
      }

      // Wait for specified offline duration
      await Future.delayed(offlineDuration);

      // Simulate coming back online
      // This would typically involve re-enabling network connectivity

      // Wait for sync to complete
      // Add appropriate waiting logic here
    } finally {
      monitor.endOperation('offlineSync');
    }
  }

  /// Get test results and performance metrics
  static Map<String, dynamic> getTestResults() {
    final monitor = SyncPerformanceMonitor();
    return {
      'performanceMetrics': monitor.getPerformanceReport(),
      'timestamp': DateTime.now().toIso8601String(),
    };
  }
}
