class BatchInfo {
  final int current;
  final int total;

  BatchInfo({
    required this.current,
    required this.total,
  });

  factory BatchInfo.fromJson(Map<String, dynamic> json) => BatchInfo(
        current: json['current'] as int,
        total: json['total'] as int,
      );

  Map<String, dynamic> toJson() => {
        'current': current,
        'total': total,
      };
}
