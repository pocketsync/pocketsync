import 'dart:async';

/// Represents all possible states of the sync system
enum SyncState {
  uninitialized,
  initialized,
  syncing,
  paused,
  manuallyPaused,
  error,
  offline,
  online
}

/// Represents all possible events that can trigger state transitions
enum SyncEvent {
  initialize,
  startSync,
  pauseSync,
  resumeSync,
  manualPause,
  manualResume,
  connectionLost,
  connectionRestored,
  error,
  reset
}

class SyncStateMachine {
  final _stateController = StreamController<SyncState>.broadcast();
  SyncState _currentState = SyncState.uninitialized;
  
  Stream<SyncState> get stateStream => _stateController.stream;
  SyncState get currentState => _currentState;

  void dispose() {
    _stateController.close();
  }

  bool canTransition(SyncEvent event) {
    return _getNextState(event) != null;
  }

  Future<bool> transition(SyncEvent event) async {
    final nextState = _getNextState(event);
    if (nextState == null) return false;

    _currentState = nextState;
    _stateController.add(_currentState);
    return true;
  }

  SyncState? _getNextState(SyncEvent event) {
    switch (_currentState) {
      case SyncState.uninitialized:
        if (event == SyncEvent.initialize) return SyncState.initialized;
        break;
        
      case SyncState.initialized:
        switch (event) {
          case SyncEvent.startSync:
            return SyncState.syncing;
          case SyncEvent.connectionLost:
            return SyncState.offline;
          case SyncEvent.error:
            return SyncState.error;
          case SyncEvent.manualPause:
            return SyncState.manuallyPaused;
          default:
            break;
        }
        break;

      case SyncState.syncing:
        switch (event) {
          case SyncEvent.pauseSync:
            return SyncState.paused;
          case SyncEvent.manualPause:
            return SyncState.manuallyPaused;
          case SyncEvent.connectionLost:
            return SyncState.offline;
          case SyncEvent.error:
            return SyncState.error;
          default:
            break;
        }
        break;

      case SyncState.paused:
        switch (event) {
          case SyncEvent.resumeSync:
            return SyncState.syncing;
          case SyncEvent.manualPause:
            return SyncState.manuallyPaused;
          case SyncEvent.connectionLost:
            return SyncState.offline;
          default:
            break;
        }
        break;

      case SyncState.manuallyPaused:
        if (event == SyncEvent.manualResume) return SyncState.initialized;
        break;

      case SyncState.error:
        if (event == SyncEvent.reset) return SyncState.initialized;
        break;

      case SyncState.offline:
        if (event == SyncEvent.connectionRestored) return SyncState.online;
        break;

      case SyncState.online:
        switch (event) {
          case SyncEvent.startSync:
            return SyncState.syncing;
          case SyncEvent.connectionLost:
            return SyncState.offline;
          case SyncEvent.manualPause:
            return SyncState.manuallyPaused;
          default:
            break;
        }
        break;
    }
    return null;
  }
}
