import 'dart:async';

/// Callback type for database change listeners
typedef DatabaseChangeListener = void Function(String table);

/// Manages database change listeners with table-specific subscriptions
class DatabaseChangeManager {
  final Map<String, Set<DatabaseChangeListener>> _tableListeners = {};
  final Set<DatabaseChangeListener> _globalListeners = {};
  Timer? _debounceTimer;

  static const _debounceDuration = Duration(milliseconds: 100);

  /// Adds a listener for all database changes
  void addGlobalListener(DatabaseChangeListener listener) {
    if (!_globalListeners.contains(listener)) {
      _globalListeners.add(listener);
    }
  }

  /// Removes a global listener
  void removeGlobalListener(DatabaseChangeListener listener) {
    _globalListeners.remove(listener);
  }

  /// Adds a listener for changes to a specific table
  void addTableListener(String table, DatabaseChangeListener listener) {
    if (!(_tableListeners[table]?.contains(listener) ?? false)) {
      _tableListeners.putIfAbsent(table, () => {}).add(listener);
    }
  }

  /// Removes a table-specific listener
  void removeTableListener(String table, DatabaseChangeListener listener) {
    _tableListeners[table]?.remove(listener);
    if (_tableListeners[table]?.isEmpty ?? false) {
      _tableListeners.remove(table);
    }
  }

  void notifySync() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(_debounceDuration, () {
      // Notify global listeners
      for (final listener in _globalListeners) {
        listener('*');
      }
    });
  }

  /// Notifies relevant listeners of a table change
  void notifyChange(String table) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(_debounceDuration, () {
      // Notify table-specific listeners
      final tableListeners = _tableListeners[table];
      if (tableListeners != null) {
        for (final listener in tableListeners) {
          listener(table);
        }
      }
    });
  }

  /// Removes all listeners
  void dispose() {
    _debounceTimer?.cancel();

    _tableListeners.clear();
    _globalListeners.clear();
  }
}
