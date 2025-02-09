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
    required String userId,
  })  : _db = db,
        _changeController = StreamController<ChangeSet>.broadcast() {
    _initializeSocket(wsUrl, deviceId, userId);
  }

  Stream<ChangeSet> get changes => _changeController.stream;

  void _initializeSocket(String wsUrl, String deviceId, String userId) {
    _socket = io.io(
      '$wsUrl/changes?deviceId=$deviceId',
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setExtraHeaders({'deviceId': deviceId})
          .setPath('/socket.io')
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(3)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .enableForceNewConnection()
          .setExtraHeaders({
            'deviceId': deviceId,
            'x-app-user-id': userId,
            'withCredentials': true,
          })
          .build(),
    );
  }

  Future<void> connect() async {
    if (_isConnected) return;

    log('Connecting to socket...');
    _setupSocketListeners();
    _socket.connect();
  }

  void _setupSocketListeners() {
    _socket.onConnect((_) => _onConnect());
    _socket.onDisconnect((_) => _onDisconnect());
    _socket.onError((error) => _onError(error));
    _socket.on('CHANGE_NOTIFICATION', (data) => _handleMessage(data));
  }

  void _onConnect() {
    log('Socket.IO Connected');
    _isConnected = true;
  }

  void _onDisconnect() {
    log('Socket.IO Disconnected');
    _isConnected = false;
  }

  void _onError(dynamic error) {
    log('Socket.IO Error: $error');
    _changeController.addError(error);
  }

  void _handleMessage(dynamic data) {
    try {
      log('Received changes from remote server');
      final changeSet = ChangeSet.fromJson(data);
      _applyChanges(changeSet);
      _changeController.add(changeSet);
    } catch (e) {
      _changeController.addError(e);
    }
  }

  Future<void> _applyChanges(ChangeSet changeSet) async {
    _db.execute('BEGIN TRANSACTION');
    try {
      _applyInsertions(changeSet);
      _applyUpdates(changeSet);
      _applyDeletions(changeSet);
      _emitChangeAcknowledgment(changeSet);
      _db.execute('COMMIT');
    } catch (e) {
      _db.execute('ROLLBACK');
      rethrow;
    }
  }

  void _applyInsertions(ChangeSet changeSet) {
    for (var entry in changeSet.insertions.changes.entries) {
      final tableName = entry.key;
      final tableRows = entry.value;

      for (var row in tableRows.rows) {
        final decodedRow = jsonDecode(row);
        final rowId = decodedRow['row_id'];
        final rowData = Map<String, dynamic>.from(decodedRow)..remove('row_id');

        final stmt = _db.prepare(
            'INSERT OR REPLACE INTO $tableName (rowid, ${rowData.keys.join(", ")}) VALUES (?, ${rowData.keys.map((_) => "?").join(", ")})');
        try {
          stmt.execute([rowId, ...rowData.values]);
        } finally {
          stmt.dispose();
        }
      }
    }
  }

  void _applyUpdates(ChangeSet changeSet) {
    for (var entry in changeSet.updates.changes.entries) {
      final tableName = entry.key;
      final tableRows = entry.value;

      for (var row in tableRows.rows) {
        final decodedRow = jsonDecode(row);
        final rowId = decodedRow['row_id'];
        final rowData = Map<String, dynamic>.from(decodedRow)..remove('row_id');

        final stmt =
            _db.prepare('UPDATE $tableName SET ${rowData.keys.map((key) => "$key = ?").join(", ")} WHERE rowid = ?');
        stmt.execute([...rowData.values, rowId]);
        stmt.dispose();
      }
    }
  }

  void _applyDeletions(ChangeSet changeSet) {
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
  }

  void _emitChangeAcknowledgment(ChangeSet changeSet) {
    _socket.emitWithAck('change', changeSet.toJson(), ack: (ackData) {
      if (ackData != null && ackData['status'] == 'success') {
        log('Device acknowledged change notification');
      } else {
        log('Device failed to acknowledge change');
        throw Exception('Change notification not acknowledged');
      }
    });
  }

  Future<void> dispose() async {
    if (!_changeController.isClosed) {
      await _changeController.close();
    }
    _socket.dispose();
    _isConnected = false;
  }
}
