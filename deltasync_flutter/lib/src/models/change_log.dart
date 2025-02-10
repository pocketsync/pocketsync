import 'package:deltasync_flutter/src/models/change_set.dart';

class ChangeLog {
  final int id;
  final String userIdentifier;
  final String deviceId;
  final ChangeSet changeSet;
  final DateTime receivedAt;
  final DateTime? processedAt;

  ChangeLog({
    required this.id,
    required this.userIdentifier,
    required this.deviceId,
    required this.changeSet,
    required this.receivedAt,
    this.processedAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_identifier': userIdentifier,
        'device_id': deviceId,
        'change_set': changeSet.toJson(),
        'received_at': receivedAt.toIso8601String(),
        'processed_at': processedAt?.toIso8601String(),
      };

  factory ChangeLog.fromJson(Map<String, dynamic> json) {
    return ChangeLog(
      id: json['id'],
      userIdentifier: json['user_identifier'],
      deviceId: json['device_id'],
      changeSet: ChangeSet.fromJson(json['change_set']),
      receivedAt: DateTime.parse(json['received_at']),
      processedAt: json['processed_at'] != null ? DateTime.parse(json['processed_at']) : null,
    );
  }

  @override
  String toString() {
    return 'ChangeLog{id: $id, userIdentifier: $userIdentifier, deviceId: $deviceId, '
        'receivedAt: $receivedAt, processedAt: $processedAt}';
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ChangeLog &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          userIdentifier == other.userIdentifier &&
          deviceId == other.deviceId &&
          changeSet == other.changeSet &&
          receivedAt == other.receivedAt &&
          processedAt == other.processedAt;

  @override
  int get hashCode =>
      id.hashCode ^
      userIdentifier.hashCode ^
      deviceId.hashCode ^
      changeSet.hashCode ^
      receivedAt.hashCode ^
      processedAt.hashCode;
}
