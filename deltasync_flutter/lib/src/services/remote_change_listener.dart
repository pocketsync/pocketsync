import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:sqlite3/sqlite3.dart';

class RemoteChangeListener {
  final Database _db;
  final StreamController<ChangeSet> _changeController;
  late final io.Socket _socket;
  bool _isConnected = false;

  RemoteChangeListener({
    required String wsUrl,
    required String deviceId,
    required Database db,
  })  : _db = db,
        _changeController = StreamController<ChangeSet>.broadcast() {
    _socket = io.io(
      wsUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'deviceId': deviceId})
          .setReconnectionAttempts(3)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .enableForceNewConnection()
          .build(),
    );
  }

  Stream<ChangeSet> get changes => _changeController.stream;

  Future<void> connect() async {
    if (_isConnected) return;

    log('Connecting to socket...');

    _socket.onConnect((_) {
      log('Socket.IO Connected');
      _isConnected = true;
    });

    _socket.onDisconnect((_) {
      log('Socket.IO Disconnected');
      _isConnected = false;
    });

    _socket.onError((error) {
      log('Socket.IO Error: $error');
      _changeController.addError(error);
    });

    _socket.on('CHANGE_NOTIFICATION', (data) => _handleMessage(data));

    _socket.connect();
  }

  void _handleMessage(dynamic data) {
    try {
      log('Received changes from remote server');
      final changeSet = ChangeSet.fromJson(data);
      _applyChanges(changeSet);
      if (!_changeController.isClosed) {
        _changeController.add(changeSet);
      }
    } catch (e) {
      if (!_changeController.isClosed) {
        _changeController.addError(e);
      }
    }
  }

  Future<void> _applyChanges(ChangeSet changeSet) async {
    _db.execute('BEGIN TRANSACTION');
    try {
      // Apply Insertions
      for (var entry in changeSet.insertions.changes.entries) {
        final tableName = entry.key;
        final tableRows = entry.value;

        for (var row in tableRows.rows) {
          final decodedRow = jsonDecode(row);
          final rowId = decodedRow['row_id'];
          final rowData = Map<String, dynamic>.from(decodedRow);
          rowData.remove('row_id');

          final stmt = _db.prepare(
              'INSERT OR REPLACE INTO $tableName (rowid, ${rowData.keys.join(", ")}) VALUES (?, ${rowData.keys.map((_) => "?").join(", ")})');
          try {
            stmt.execute([rowId, ...rowData.values]);
          } finally {
            stmt.dispose();
          }
        }
      }

      // Apply Updates
      for (var entry in changeSet.updates.changes.entries) {
        final tableName = entry.key;
        final tableRows = entry.value;

        for (var row in tableRows.rows) {
          final decodedRow = jsonDecode(row);
          final rowId = decodedRow['row_id'];
          final rowData = Map<String, dynamic>.from(decodedRow);
          rowData.remove('row_id');

          final stmt =
              _db.prepare('UPDATE $tableName SET ${rowData.keys.map((key) => "$key = ?").join(", ")} WHERE rowid = ?');
          stmt.execute([...rowData.values, rowId]);
          stmt.dispose();
        }
      }

      // Apply Deletions
      for (var entry in changeSet.deletions.changes.entries) {
        final tableName = entry.key;
        final tableRows = entry.value;

        for (var row in tableRows.rows) {
          final decodedRow = jsonDecode(row);
          final stmt = _db.prepare('DELETE FROM $tableName WHERE rowid = ?');
          stmt.execute([decodedRow['row_id']]);
          stmt.dispose();
        }
      }

      _db.execute('COMMIT');
    } catch (e) {
      _db.execute('ROLLBACK');
      rethrow;
    }
  }

  Future<void> dispose() async {
    if (!_changeController.isClosed) {
      await _changeController.close();
    }
    _socket.dispose();
    _isConnected = false;
  }
}
