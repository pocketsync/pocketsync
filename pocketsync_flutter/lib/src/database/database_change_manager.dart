typedef DatabaseChangeListener = void Function(
    List<Map<String, dynamic>> changes);

/// Manages database change listeners
class DatabaseChangeManager {
  final Set<DatabaseChangeListener> _listeners = {};

  /// Adds a listener that will be called when database changes occur
  void addListener(DatabaseChangeListener listener) {
    _listeners.add(listener);
  }

  /// Removes a previously added listener
  void removeListener(DatabaseChangeListener listener) {
    _listeners.remove(listener);
  }

  /// Notifies all listeners of changes
  void notifyListeners(List<Map<String, dynamic>> changes) {
    for (final listener in _listeners) {
      listener(changes);
    }
  }

  /// Removes all listeners
  void dispose() {
    _listeners.clear();
  }
}
