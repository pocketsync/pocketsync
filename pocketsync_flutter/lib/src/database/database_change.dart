import 'dart:convert';

/// Represents a database change event
class PsDatabaseChange {
  final String tableName;
  final String operation;
  final Map<String, dynamic> data;
  final String recordId;
  final DateTime timestamp;

  PsDatabaseChange({
    required this.tableName,
    required this.operation,
    required this.data,
    required this.recordId,
    required this.timestamp,
  });

  factory PsDatabaseChange.fromJson(Map<String, dynamic> map) {
    return PsDatabaseChange(
      tableName: map['table_name'] as String,
      operation: map['operation'] as String,
      data: Map<String, dynamic>.from(jsonDecode(map['data'] as String)),
      recordId: map['record_rowid'] as String,
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] as int),
    );
  }
}
