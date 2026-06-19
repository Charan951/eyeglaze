import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/app_config.dart';
import '../services/auth_service.dart';

class ApiService {
  final http.Client _client = http.Client();
  final AuthService _authService;

  ApiService(this._authService);

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  String _url(String path) => '${AppConfig.baseUrl}$path';

  // Auth
  Future<Map<String, dynamic>> sendOtp({String? phone, String? email, String countryCode = '+91'}) async {
    final body = phone != null
        ? {'phone': phone, 'countryCode': countryCode}
        : {'email': email};
    final res = await _client.post(
      Uri.parse(_url('/auth/send-otp')),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyOtp({String? phone, String? email, required String otp}) async {
    final body = phone != null ? {'phone': phone, 'otp': otp} : {'email': email, 'otp': otp};
    final res = await _client.post(
      Uri.parse(_url('/auth/verify-otp')),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Products
  Future<Map<String, dynamic>> getProducts({String? category, String? search, String? sort, int page = 1}) async {
    final params = <String, String>{};
    if (category != null) params['category'] = category;
    if (search != null) params['search'] = search;
    if (sort != null) params['sort'] = sort;
    params['page'] = page.toString();
    params['limit'] = '20';

    final uri = Uri.parse(_url('/products')).replace(queryParameters: params);
    final res = await _client.get(uri, headers: await _getHeaders());
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getProduct(String id) async {
    final res = await _client.get(Uri.parse(_url('/products/$id')), headers: await _getHeaders());
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Lens Options
  Future<List<dynamic>> getLensOptions() async {
    final res = await _client.get(Uri.parse(_url('/lens-options')), headers: await _getHeaders());
    final data = jsonDecode(res.body);
    return data is List ? data : (data['lensOptions'] ?? data['data'] ?? []);
  }

  // Cart
  Future<Map<String, dynamic>> getCart() async {
    final res = await _client.get(Uri.parse(_url('/cart')), headers: await _getHeaders());
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> addToCart(Map<String, dynamic> item) async {
    final res = await _client.post(
      Uri.parse(_url('/cart')),
      headers: await _getHeaders(),
      body: jsonEncode(item),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> removeFromCart(String itemId) async {
    final res = await _client.delete(
      Uri.parse(_url('/cart/$itemId')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateCartItem(String itemId, Map<String, dynamic> data) async {
    final res = await _client.put(
      Uri.parse(_url('/cart/$itemId')),
      headers: await _getHeaders(),
      body: jsonEncode(data),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Orders
  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    final res = await _client.post(
      Uri.parse(_url('/orders')),
      headers: await _getHeaders(),
      body: jsonEncode(orderData),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getOrders() async {
    final res = await _client.get(Uri.parse(_url('/orders')), headers: await _getHeaders());
    final data = jsonDecode(res.body);
    return data is List ? data : (data['orders'] ?? data['data'] ?? []);
  }

  Future<Map<String, dynamic>> getOrder(String id) async {
    final res = await _client.get(Uri.parse(_url('/orders/$id')), headers: await _getHeaders());
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Coupons
  Future<Map<String, dynamic>> validateCoupon(String code, double orderTotal) async {
    final res = await _client.post(
      Uri.parse(_url('/coupons/validate')),
      headers: await _getHeaders(),
      body: jsonEncode({'code': code, 'orderTotal': orderTotal}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Profile
  Future<Map<String, dynamic>> getProfile() async {
    final res = await _client.get(Uri.parse(_url('/auth/me')), headers: await _getHeaders());
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 && data['user'] != null) {
      data['success'] = true;
    }
    return data;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await _client.put(
      Uri.parse(_url('/auth/profile')),
      headers: await _getHeaders(),
      body: jsonEncode(data),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login({required String email, required String password}) async {
    final res = await _client.post(
      Uri.parse(_url('/auth/login')),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await _client.post(
      Uri.parse(_url('/auth/register')),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> activateMembership() async {
    final res = await _client.post(
      Uri.parse(_url('/auth/membership/activate')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> addWalletMoney(double amount) async {
    final res = await _client.post(
      Uri.parse(_url('/auth/wallet/add')),
      headers: await _getHeaders(),
      body: jsonEncode({'amount': amount, 'method': 'upi'}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Wishlist
  Future<Map<String, dynamic>> getWishlist() async {
    final res = await _client.get(Uri.parse(_url('/wishlist')), headers: await _getHeaders());
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> toggleWishlist(String productId) async {
    final res = await _client.post(
      Uri.parse(_url('/wishlist/toggle')),
      headers: await _getHeaders(),
      body: jsonEncode({'productId': productId}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
