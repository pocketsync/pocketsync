import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'dart:math' as math;
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:deltasync_flutter/src/models/change_set.dart';
import 'package:sqlite3/sqlite3.dart';

class RemoteChangeListener {
  final Database _db;
  final StreamController<ChangeSet> _changeController;
  late final io.Socket _socket;
  bool _isConnected = false;
  bool _isDisposed = false;
  Timer? _reconnectTimer;
  static const _maxReconnectAttempts = 5;
  int _reconnectAttempts = 0;

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
          .setTransports(['websocket'])
          .setExtraHeaders({
            'deviceId': deviceId,
            'x-app-user-id': userId,
            'withCredentials': true,
          })
          .setPath('/socket.io')
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(_maxReconnectAttempts)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .enableForceNewConnection()
          .build(),
    );
  }

  Future<void> connect() async {
    if (_isDisposed) {
      throw StateError('RemoteChangeListener has been disposed');
    }
    if (_isConnected) return;

    log('Connecting to socket...');
    _setupSocketListeners();
    _socket.connect();
  }

  void _setupSocketListeners() {
    _socket
      ..onConnect((_) => _onConnect())
      ..onDisconnect((_) => _onDisconnect())
      ..onError((error) => _onError(error))
      ..onConnectError((error) => _onError(error))
      ..on('CHANGE_NOTIFICATION', (data) => _handleMessage(data));
  }

  void _onConnect() {
    log('Socket.IO Connected');
    _isConnected = true;
    _reconnectAttempts = 0;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  void _onDisconnect() {
    log('Socket.IO Disconnected');
    _isConnected = false;

    if (!_isDisposed && _reconnectAttempts < _maxReconnectAttempts) {
      _reconnectTimer?.cancel();
      _reconnectTimer = Timer(
        Duration(seconds: math.min(math.pow(2, _reconnectAttempts).toInt(), 30)),
        () {
          _reconnectAttempts++;
          if (!_isDisposed) {
            log('Attempting reconnection ($_reconnectAttempts/$_maxReconnectAttempts)');
            _socket.connect();
          }
        },
      );
    }
  }

  void _onError(dynamic error) {
    log('Socket.IO Error: $error');
    if (!_isDisposed) {
      _changeController.addError(error);
    }
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
    if (_isDisposed) return;

    _db.execute('BEGIN IMMEDIATE TRANSACTION');
    try {
      await _applyInsertions(changeSet);
      await _applyUpdates(changeSet);
      await _applyDeletions(changeSet);
      await _emitChangeAcknowledgment(changeSet);
      _db.execute('COMMIT');
    } catch (e) {
      _db.execute('ROLLBACK');
      rethrow;
    }
  }

  Future<void> _applyInsertions(ChangeSet changeSet) async {
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

  Future<void> _applyUpdates(ChangeSet changeSet) async {
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

  Future<void> _applyDeletions(ChangeSet changeSet) async {
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

  Future<void> _emitChangeAcknowledgment(ChangeSet changeSet) async {
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
    if (_isDisposed) return;
    _isDisposed = true;

    _reconnectTimer?.cancel();
    _socket.dispose();
    await _changeController.close();
  }
}
