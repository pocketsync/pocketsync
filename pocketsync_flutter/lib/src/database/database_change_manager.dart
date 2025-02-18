import 'package:pocketsync_flutter/src/database/database_change.dart';

/// Callback type for database change listeners
typedef DatabaseChangeListener = void Function(PsDatabaseChange change);

/// Manages database change listeners with table-specific subscriptions
class DatabaseChangeManager {
  final Map<String, Set<DatabaseChangeListener>> _tableListeners = {};
  final Set<DatabaseChangeListener> _globalListeners = {};

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
    // Notify global listeners
    for (final listener in _globalListeners) {
      listener(change);
    }

    // Notify table-specific listeners
    _tableListeners[change.tableName]?.forEach((listener) {
      listener(change);
    });
  }

  /// Removes all listeners
  void dispose() {
    _tableListeners.clear();
    _globalListeners.clear();
  }
}
