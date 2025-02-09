class SyncError implements Exception {
  final String message;

  SyncError(this.message);

  @override
  String toString() => 'SyncError: $message';
}
