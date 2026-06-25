import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';

class AuthService extends ChangeNotifier {
  static const _tokenKey = 'auth_token';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  User? _currentUser;
  bool _isLoggedIn = false;

  User? get currentUser => _currentUser;
  bool get isLoggedIn => _isLoggedIn;

  Future<void> init() async {
    final token = await getToken();
    if (token != null) {
      _isLoggedIn = true;
      notifyListeners();
    }
  }

  Future<void> saveToken(String token, {User? user}) async {
    await _storage.write(key: _tokenKey, value: token);
    _currentUser = user;
    _isLoggedIn = true;
    notifyListeners();
  }

  Future<String?> getToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Secure storage decryption error: $e');
      }
      try {
        await _storage.delete(key: _tokenKey);
      } catch (_) {}
      return null;
    }
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
    _currentUser = null;
    _isLoggedIn = false;
    notifyListeners();
  }

  void setUser(User user) {
    _currentUser = user;
    notifyListeners();
  }
}
