import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class DeviceManager {
  static const _deviceIdKey = 'deltasync_device_id';
  final SharedPreferences _prefs;

  DeviceManager(this._prefs);

  String getDeviceId() {
    // String? deviceId = _prefs.getString(_deviceIdKey);
    // if (deviceId == null) {
    //   deviceId = const Uuid().v4();
    //   _prefs.setString(_deviceIdKey, deviceId);
    // }
    // return deviceId;

    return defaultTargetPlatform == TargetPlatform.iOS ? 'ios-device' : 'android-device';
  }
}
