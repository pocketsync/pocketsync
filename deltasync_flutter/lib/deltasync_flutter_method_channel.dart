import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'deltasync_flutter_platform_interface.dart';

/// An implementation of [DeltasyncFlutterPlatform] that uses method channels.
class MethodChannelDeltasyncFlutter extends DeltasyncFlutterPlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = const MethodChannel('deltasync_flutter');

  @override
  Future<String?> getPlatformVersion() async {
    final version = await methodChannel.invokeMethod<String>('getPlatformVersion');
    return version;
  }
}
