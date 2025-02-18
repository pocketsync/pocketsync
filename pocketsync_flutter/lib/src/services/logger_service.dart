import 'dart:developer' as developer;

enum LogLevel { debug, info, warning, error }

class LoggerService {
  static final LoggerService instance = LoggerService._internal();
  LoggerService._internal();

  LogLevel _minLevel = LogLevel.info;

  void setLogLevel(LogLevel level) {
    _minLevel = level;
  }

  bool _shouldLog(LogLevel level) {
    return level.index >= _minLevel.index;
  }

  void _log(LogLevel level, String message,
      {Object? error, StackTrace? stackTrace}) {
    if (!_shouldLog(level)) return;

    final timestamp = DateTime.now().toIso8601String();
    final logMessage = '[$timestamp][${level.name.toUpperCase()}] $message';

    developer.log(
      logMessage,
      time: DateTime.now(),
      error: error,
      stackTrace: stackTrace,
      level: level.index,
      name: 'PocketSync',
    );
  }

  void debug(String message, {Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.debug, message, error: error, stackTrace: stackTrace);
  }

  void info(String message, {Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.info, message, error: error, stackTrace: stackTrace);
  }

  void warning(String message, {Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.warning, message, error: error, stackTrace: stackTrace);
  }

  void error(String message, {Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.error, message, error: error, stackTrace: stackTrace);
  }
}
