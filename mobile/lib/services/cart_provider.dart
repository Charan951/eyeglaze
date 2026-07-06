import 'package:flutter/foundation.dart';
import '../models/cart_item.dart';
import 'api_service.dart';
import 'auth_service.dart';

class CartProvider extends ChangeNotifier {
  final AuthService _authService;
  List<CartItem> _items = [];
  bool _loading = false;

  CartProvider(this._authService) {
    if (_authService.isLoggedIn) {
      loadCart();
    }
    _authService.addListener(_onAuthChanged);
  }

  List<CartItem> get items => _items;
  int get itemCount => _items.length;
  bool get isLoading => _loading;
  double get subtotal => _items.fold(0.0, (s, i) {
        final originalFramePrice = i.product?.nonMemberPrice ?? i.product?.sellingPrice ?? i.framePrice;
        return s + (originalFramePrice + (i.lensPrice ?? 0.0)) * i.qty;
      });

  double get productDiscount => _items.fold(0.0, (s, i) {
        final originalFramePrice = i.product?.nonMemberPrice ?? i.product?.sellingPrice ?? i.framePrice;
        final diff = originalFramePrice - i.framePrice;
        return s + (diff > 0.0 ? diff : 0.0) * i.qty;
      });

  double get fittingFee => _items.any((i) => (i.lensPrice ?? 0.0) > 0.0 || i.lensType != null) ? 199.0 : 0.0;

  double get delivery => _items.isNotEmpty ? (_authService.currentUser?.membershipActive == true ? 0.0 : 99.0) : 0.0;

  double get total => subtotal + fittingFee + delivery - productDiscount;

  void _onAuthChanged() {
    if (_authService.isLoggedIn) {
      loadCart();
    } else {
      _items = [];
      notifyListeners();
    }
  }

  Future<void> loadCart() async {
    if (!_authService.isLoggedIn) return;
    _loading = true;
    notifyListeners();
    try {
      final api = ApiService(_authService);
      final data = await api.getCart();
      final cartItems = ((data['cart'] as Map?)?['items'] ?? data['items'] ?? []) as List;
      _items = cartItems.map((i) => CartItem.fromJson(i)).toList();
    } catch (e) {
      if (kDebugMode) {
        print('Error loading cart in CartProvider: $e');
      }
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> addToCart(Map<String, dynamic> itemPayload) async {
    if (!_authService.isLoggedIn) return;
    try {
      final api = ApiService(_authService);
      await api.addToCart(itemPayload);
      await loadCart();
    } catch (e) {
      if (kDebugMode) {
        print('Error adding to cart in CartProvider: $e');
      }
      rethrow;
    }
  }

  Future<void> removeFromCart(String itemId) async {
    if (!_authService.isLoggedIn) return;
    try {
      final api = ApiService(_authService);
      await api.removeFromCart(itemId);
      await loadCart();
    } catch (e) {
      if (kDebugMode) {
        print('Error removing from cart in CartProvider: $e');
      }
      rethrow;
    }
  }

  Future<void> updateCartItem(String itemId, Map<String, dynamic> data) async {
    if (!_authService.isLoggedIn) return;
    try {
      final api = ApiService(_authService);
      await api.updateCartItem(itemId, data);
      await loadCart();
    } catch (e) {
      if (kDebugMode) {
        print('Error updating cart item in CartProvider: $e');
      }
      rethrow;
    }
  }

  void clearCartLocal() {
    _items = [];
    notifyListeners();
  }

  @override
  void dispose() {
    _authService.removeListener(_onAuthChanged);
    super.dispose();
  }
}
