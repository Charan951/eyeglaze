import 'dart:io';
import 'package:flutter/foundation.dart';

class AppConfig {
  static const bool isProduction = false; // Set to true for production, false for local development

  static String get baseUrl {
    if (isProduction) {
      return 'https://api.eyeglaze.in/api';
    }
    if (kIsWeb) {
      return 'http://localhost:5001/api';
    }
    if (Platform.isAndroid) {
      // Since we run 'adb reverse tcp:5001 tcp:5001', physical devices and emulators can access localhost (127.0.0.1) directly.
      return 'http://127.0.0.1:5001/api';
    }
    return 'http://localhost:5001/api';
  }

  static String resolveImageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    final apiBase = baseUrl;
    final serverBase = apiBase.endsWith('/api')
        ? apiBase.substring(0, apiBase.length - 4)
        : apiBase;

    if (url.startsWith('/')) {
      return '$serverBase$url';
    } else {
      return '$serverBase/$url';
    }
  }
}
