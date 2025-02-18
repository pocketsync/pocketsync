class SchemaChange {
  final String tableName;
  final int version;
  final int timestamp;

  SchemaChange({
    required this.tableName,
    required this.version,
    required this.timestamp,
  });
}
