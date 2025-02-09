class TableRows {
  final List<String> rows;

  TableRows(this.rows);

  Map<String, dynamic> toJson() => {
        'rows': rows,
      };
}

class TableChanges {
  final Map<String, TableRows> changes;

  TableChanges(this.changes);

  Map<String, dynamic> toJson() => changes.map((key, value) => MapEntry(key, value.toJson()));
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
}
