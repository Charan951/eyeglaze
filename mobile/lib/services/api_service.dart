import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../core/app_config.dart';
import '../services/auth_service.dart';

class ApiService {
  final http.Client _client = http.Client();
  final AuthService _authService;

  ApiService(this._authService);

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  String _url(String path) => '${AppConfig.baseUrl}$path';

  // Auth
  Future<Map<String, dynamic>> sendOtp({
    String? phone,
    String? email,
    String countryCode = '+91',
  }) async {
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

  Future<Map<String, dynamic>> verifyOtp({
    String? phone,
    String? email,
    required String otp,
  }) async {
    final body = phone != null
        ? {'phone': phone, 'otp': otp}
        : {'email': email, 'otp': otp};
    final res = await _client.post(
      Uri.parse(_url('/auth/verify-otp')),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final res = await _client.post(
      Uri.parse(_url('/auth/forgot-password')),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final res = await _client.post(
      Uri.parse(_url('/auth/reset-password')),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'token': token, 'newPassword': newPassword}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Products
  Future<Map<String, dynamic>> getProducts({
    String? category,
    String? search,
    String? sort,
    String? shape,
    String? material,
    String? size,
    String? color,
    String? gender,
    int page = 1,
  }) async {
    final params = <String, String>{};
    if (category != null) params['category'] = category;
    if (search != null) params['search'] = search;
    if (sort != null) params['sort'] = sort;
    if (shape != null) params['shape'] = shape;
    if (material != null) params['material'] = material;
    if (size != null) params['size'] = size;
    if (color != null) params['color'] = color;
    if (gender != null) params['gender'] = gender;
    params['page'] = page.toString();
    params['limit'] = '20';

    final uri = Uri.parse(_url('/products')).replace(queryParameters: params);
    final res = await _client.get(uri, headers: await _getHeaders());
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getProduct(String id) async {
    final res = await _client.get(
      Uri.parse(_url('/products/$id')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Lens Options
  Future<List<dynamic>> getLensOptions() async {
    final res = await _client.get(
      Uri.parse(_url('/lens-options')),
      headers: await _getHeaders(),
    );
    final data = jsonDecode(res.body);
    return data is List ? data : (data['lensOptions'] ?? data['data'] ?? []);
  }

  // Cart
  Future<Map<String, dynamic>> getCart() async {
    final res = await _client.get(
      Uri.parse(_url('/cart')),
      headers: await _getHeaders(),
    );
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

  Future<Map<String, dynamic>> updateCartItem(
    String itemId,
    Map<String, dynamic> data,
  ) async {
    final res = await _client.put(
      Uri.parse(_url('/cart/$itemId')),
      headers: await _getHeaders(),
      body: jsonEncode(data),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Orders
  Future<Map<String, dynamic>> createOrder(
    Map<String, dynamic> orderData,
  ) async {
    final res = await _client.post(
      Uri.parse(_url('/orders')),
      headers: await _getHeaders(),
      body: jsonEncode(orderData),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getOrders() async {
    final res = await _client.get(
      Uri.parse(_url('/orders')),
      headers: await _getHeaders(),
    );
    final data = jsonDecode(res.body);
    return data is List ? data : (data['orders'] ?? data['data'] ?? []);
  }

  Future<Map<String, dynamic>> getOrder(String id) async {
    final res = await _client.get(
      Uri.parse(_url('/orders/$id')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Coupons
  Future<Map<String, dynamic>> validateCoupon(
    String code,
    double orderTotal,
  ) async {
    final res = await _client.post(
      Uri.parse(_url('/coupons/validate')),
      headers: await _getHeaders(),
      body: jsonEncode({
        'code': code,
        'orderTotal': orderTotal,
        'cartTotal': orderTotal,
      }),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Profile
  Future<Map<String, dynamic>> getProfile() async {
    final res = await _client.get(
      Uri.parse(_url('/auth/me')),
      headers: await _getHeaders(),
    );
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

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
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

  // Addresses
  Future<Map<String, dynamic>> addAddress(
    Map<String, dynamic> addressData,
  ) async {
    final res = await _client.post(
      Uri.parse(_url('/auth/addresses')),
      headers: await _getHeaders(),
      body: jsonEncode(addressData),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateAddress(
    String id,
    Map<String, dynamic> addressData,
  ) async {
    final res = await _client.put(
      Uri.parse(_url('/auth/addresses/$id')),
      headers: await _getHeaders(),
      body: jsonEncode(addressData),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> deleteAddress(String id) async {
    final res = await _client.delete(
      Uri.parse(_url('/auth/addresses/$id')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> setDefaultAddress(String id) async {
    final res = await _client.put(
      Uri.parse(_url('/auth/addresses/$id/default')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Prescriptions
  Future<Map<String, dynamic>> getPrescriptions() async {
    final res = await _client.get(
      Uri.parse(_url('/prescriptions')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> addPrescription({
    Map<String, dynamic>? re,
    Map<String, dynamic>? le,
    double? pd,
    List<int>? fileBytes,
    String? fileName,
    String? mimeType,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse(_url('/prescriptions')),
    );
    final headers = await _getHeaders();
    request.headers.addAll(headers);

    if (re != null) {
      request.fields['RE'] = jsonEncode(re);
    }
    if (le != null) {
      request.fields['LE'] = jsonEncode(le);
    }
    if (pd != null) {
      request.fields['pd'] = pd.toString();
    }
    if (fileBytes != null && fileName != null) {
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
          contentType: mimeType != null ? MediaType.parse(mimeType) : null,
        ),
      );
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  // Tickets
  Future<Map<String, dynamic>> getTickets() async {
    final res = await _client.get(
      Uri.parse(_url('/tickets')),
      headers: await _getHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createTicket(
    Map<String, dynamic> ticketData,
  ) async {
    final res = await _client.post(
      Uri.parse(_url('/tickets')),
      headers: await _getHeaders(),
      body: jsonEncode(ticketData),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Membership
  Future<Map<String, dynamic>> activateMembership({
    String? paymentMethod,
  }) async {
    final body = paymentMethod != null
        ? {'paymentMethod': paymentMethod}
        : null;
    final res = await _client.post(
      Uri.parse(_url('/auth/membership/activate')),
      headers: await _getHeaders(),
      body: body != null ? jsonEncode(body) : null,
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
    final res = await _client.get(
      Uri.parse(_url('/wishlist')),
      headers: await _getHeaders(),
    );
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
