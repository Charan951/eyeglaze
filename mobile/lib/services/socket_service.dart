import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/app_config.dart';

class SocketService extends ChangeNotifier {
  io.Socket? _socket;

  io.Socket? get socket => _socket;
  bool get isConnected => _socket?.connected ?? false;

  void connect() {
    if (_socket != null && _socket!.connected) return;

    final String apiBase = AppConfig.baseUrl;
    final String socketUrl = apiBase.endsWith('/api')
        ? apiBase.substring(0, apiBase.length - 4)
        : apiBase;

    _socket = io.io(socketUrl, io.OptionBuilder()
      .setTransports(['websocket'])
      .enableAutoConnect()
      .build());

    _socket!.onConnect((_) {
      if (kDebugMode) {
        print('Socket connected to: $socketUrl');
      }
      notifyListeners();
    });

    _socket!.onDisconnect((_) {
      if (kDebugMode) {
        print('Socket disconnected');
      }
      notifyListeners();
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    notifyListeners();
  }
}
