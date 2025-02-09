class TableRows {
  final List<String> rows;

  TableRows(this.rows);

  Map<String, dynamic> toJson() => {'rows': rows};

  factory TableRows.fromJson(Map<String, dynamic> json) {
    return TableRows(
      List<String>.from(json['rows']),
    );
  }
}

class TableChanges {
  final Map<String, TableRows> changes;

  TableChanges(this.changes);

  Map<String, dynamic> toJson() => changes.map((key, value) => MapEntry(key, value.toJson()));

  factory TableChanges.fromJson(Map<String, dynamic> json) {
    return TableChanges(
      Map<String, TableRows>.fromEntries(
        json.entries.map(
          (e) => MapEntry(
            e.key,
            TableRows.fromJson(e.value),
          ),
        ),
      ),
    );
  }
}

class ChangeSet {
  final int timestamp;
  final int version;
  final TableChanges insertions;
  final TableChanges updates;
  final TableChanges deletions;

  ChangeSet({
    required this.timestamp,
    required this.version,
    required this.insertions,
    required this.updates,
    required this.deletions,
  });

  Map<String, dynamic> toJson() => {
        'timestamp': timestamp,
        'version': version,
        'insertions': insertions.toJson(),
        'updates': updates.toJson(),
        'deletions': deletions.toJson(),
      };

  factory ChangeSet.fromJson(Map<String, dynamic> json) {
    return ChangeSet(
      timestamp: json['timestamp'],
      version: json['version'],
      insertions: TableChanges.fromJson(json['insertions']),
      updates: TableChanges.fromJson(json['updates']),
      deletions: TableChanges.fromJson(json['deletions']),
    );
  }
}
