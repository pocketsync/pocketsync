class SyncError implements Exception {
  final String message;
  final Exception? innerError;

  SyncError(this.message, {this.innerError});

  @override
  String toString() => 'SyncError: $message';
}
