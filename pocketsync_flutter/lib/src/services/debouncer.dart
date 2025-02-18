import 'dart:async';

/// A utility class that introduces a delay between multiple function calls
/// and only executes the last call after the specified duration.
class Debouncer {
  final Duration delay;
  Timer? _timer;

  Debouncer({
    this.delay = const Duration(milliseconds: 1000),
  });

  /// Cancels the previous call if any and schedules a new one
  void run(void Function() action) {
    _timer?.cancel();
    _timer = Timer(delay, action);
  }

  /// Cancels any pending operation
  void dispose() {
    _timer?.cancel();
    _timer = null;
  }
}
