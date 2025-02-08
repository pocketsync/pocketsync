import 'package:flutter_test/flutter_test.dart';
import 'package:deltasync_flutter/deltasync_flutter.dart';
import 'package:deltasync_flutter/deltasync_flutter_platform_interface.dart';
import 'package:deltasync_flutter/deltasync_flutter_method_channel.dart';
import 'package:plugin_platform_interface/plugin_platform_interface.dart';

class MockDeltasyncFlutterPlatform
    with MockPlatformInterfaceMixin
    implements DeltasyncFlutterPlatform {

  @override
  Future<String?> getPlatformVersion() => Future.value('42');
}

void main() {
  final DeltasyncFlutterPlatform initialPlatform = DeltasyncFlutterPlatform.instance;

  test('$MethodChannelDeltasyncFlutter is the default instance', () {
    expect(initialPlatform, isInstanceOf<MethodChannelDeltasyncFlutter>());
  });

  test('getPlatformVersion', () async {
    DeltasyncFlutter deltasyncFlutterPlugin = DeltasyncFlutter();
    MockDeltasyncFlutterPlatform fakePlatform = MockDeltasyncFlutterPlatform();
    DeltasyncFlutterPlatform.instance = fakePlatform;

    expect(await deltasyncFlutterPlugin.getPlatformVersion(), '42');
  });
}
