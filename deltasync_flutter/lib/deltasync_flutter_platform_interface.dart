import 'package:plugin_platform_interface/plugin_platform_interface.dart';

import 'deltasync_flutter_method_channel.dart';

abstract class DeltasyncFlutterPlatform extends PlatformInterface {
  /// Constructs a DeltasyncFlutterPlatform.
  DeltasyncFlutterPlatform() : super(token: _token);

  static final Object _token = Object();

  static DeltasyncFlutterPlatform _instance = MethodChannelDeltasyncFlutter();

  /// The default instance of [DeltasyncFlutterPlatform] to use.
  ///
  /// Defaults to [MethodChannelDeltasyncFlutter].
  static DeltasyncFlutterPlatform get instance => _instance;

  /// Platform-specific implementations should set this with their own
  /// platform-specific class that extends [DeltasyncFlutterPlatform] when
  /// they register themselves.
  static set instance(DeltasyncFlutterPlatform instance) {
    PlatformInterface.verifyToken(instance, _token);
    _instance = instance;
  }

  Future<String?> getPlatformVersion() {
    throw UnimplementedError('platformVersion() has not been implemented.');
  }
}
