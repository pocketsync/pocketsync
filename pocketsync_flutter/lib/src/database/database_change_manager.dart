import 'dart:async';
import 'package:pocketsync_flutter/src/database/database_change.dart';

/// Callback type for database change listeners
typedef DatabaseChangeListener = void Function(PsDatabaseChange change);

/// Manages database change listeners with table-specific subscriptions
class DatabaseChangeManager {
  final Map<String, Set<DatabaseChangeListener>> _tableListeners = {};
  final Set<DatabaseChangeListener> _globalListeners = {};
  Timer? _debounceTimer;
  final _pendingChanges = <PsDatabaseChange>[];
  static const _debounceDuration = Duration(milliseconds: 100);

  /// Adds a listener for all database changes
  void addGlobalListener(DatabaseChangeListener listener) {
    _globalListeners.add(listener);
  }

  /// Removes a global listener
  void removeGlobalListener(DatabaseChangeListener listener) {
    _globalListeners.remove(listener);
  }

  /// Adds a listener for changes to a specific table
  void addTableListener(String table, DatabaseChangeListener listener) {
    _tableListeners.putIfAbsent(table, () => {}).add(listener);
  }

  /// Removes a table-specific listener
  void removeTableListener(String table, DatabaseChangeListener listener) {
    _tableListeners[table]?.remove(listener);
    if (_tableListeners[table]?.isEmpty ?? false) {
      _tableListeners.remove(table);
    }
  }

  /// Notifies relevant listeners of a database change
  void notifyChange(PsDatabaseChange change) {
    _pendingChanges.add(change);

    _debounceTimer?.cancel();
    _debounceTimer = Timer(_debounceDuration, () {
      if (_pendingChanges.isEmpty) return;

      final changes = List<PsDatabaseChange>.from(_pendingChanges);
      _pendingChanges.clear();

      // Group changes by table
      final changesByTable = <String, List<PsDatabaseChange>>{};
      for (final change in changes) {
        changesByTable.putIfAbsent(change.tableName, () => []).add(change);
      }

      // Notify global listeners with all changes at once
      for (final listener in _globalListeners) {
        listener(change);
      }

      // Notify table-specific listeners with their relevant changes
      for (final entry in changesByTable.entries) {
        final tableListeners = _tableListeners[entry.key];
        if (tableListeners != null) {
          for (final listener in tableListeners) {
            listener(change);
          }
        }
      }
    });
  }

  /// Removes all listeners
  void dispose() {
    _debounceTimer?.cancel();
    _pendingChanges.clear();
    _tableListeners.clear();
    _globalListeners.clear();
  }
}
