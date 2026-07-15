import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_item.dart';
import '../models/product.dart';
import 'api_service.dart';
import 'auth_service.dart';

class CartProvider extends ChangeNotifier {
  final AuthService _authService;
  List<CartItem> _items = [];
  bool _loading = false;

  CartProvider(this._authService) {
    if (_authService.isLoggedIn) {
      loadCart();
    } else {
      _loadLocalCart();
    }
    _authService.addListener(_onAuthChanged);
  }

  List<CartItem> get items => _items;
  int get itemCount => _items.length;
  bool get isLoading => _loading;

  // Coupons & Membership state
  bool _addGoldMembership = false;
  String? _appliedCouponCode;
  double _couponDiscount = 0.0;
  bool _userRemovedCoupon = false;
  bool _hasUsedBogoThisMonth = false;
  String? _couponError;
  String? _couponSuccessMessage;

  bool get addGoldMembership => _addGoldMembership;
  String? get appliedCouponCode => _appliedCouponCode;
  double get couponDiscount => _couponDiscount;
  bool get userRemovedCoupon => _userRemovedCoupon;
  bool get hasUsedBogoThisMonth => _hasUsedBogoThisMonth;
  String? get couponError => _couponError;
  String? get couponSuccessMessage => _couponSuccessMessage;

  void setAddGoldMembership(bool val) async {
    _addGoldMembership = val;
    _couponError = null;
    _couponSuccessMessage = null;
    notifyListeners();

    if (_authService.isLoggedIn) {
      try {
        final api = ApiService(_authService);
        await api.updateCartMembership(val);
        await loadCart();
      } catch (e) {
        if (kDebugMode) {
          print('Error updating membership on backend: $e');
        }
      }
    } else {
      await _revalidateCouponIfNeeded();
    }
  }

  void clearCouponMessages() {
    _couponError = null;
    _couponSuccessMessage = null;
    notifyListeners();
  }

  bool get isMember => _authService.currentUser?.membershipActive == true || _addGoldMembership;

  int get remainingOneRupeeFrames {
    final user = _authService.currentUser;
    final usedCount = user != null ? user.oneRupeeOfferCount : 0;
    return (2 - usedCount).clamp(0, 2);
  }

  bool get isBogoActive {
    if (_hasUsedBogoThisMonth) return false;
    if (!isMember) return false;
    final totalBogoQty = _items.fold<int>(0, (sum, item) {
      if (item.product?.buy1Get1 == true) {
        return sum + item.qty;
      }
      return sum;
    });
    return totalBogoQty >= 2;
  }

  List<Map<String, dynamic>> get itemsWithPricing {
    int oneRupeeFramesCount = 0;
    final remaining = remainingOneRupeeFrames;
    final bogoActive = isBogoActive;
    final member = isMember;
    final user = _authService.currentUser;

    return _items.map((item) {
      double framePrice = item.framePrice;

      if (!bogoActive &&
          item.product?.oneRupeeFrameOffer == true &&
          member &&
          user?.oneRupeeOfferUsed == false &&
          (user?.oneRupeeOfferCount ?? 0) < 2 &&
          oneRupeeFramesCount < remaining) {
        final int allowed = (item.qty < (remaining - oneRupeeFramesCount))
            ? item.qty
            : (remaining - oneRupeeFramesCount);
        final double regularPrice = item.product?.memberPrice ?? item.framePrice;
        final double totalFramePriceForQty = (allowed * 1.0) + ((item.qty - allowed) * regularPrice);
        framePrice = totalFramePriceForQty / item.qty;
        oneRupeeFramesCount += allowed;
      } else if (item.product?.memberPrice != null && member) {
        framePrice = item.product!.memberPrice!;
      } else if (item.product?.nonMemberPrice != null && !member) {
        framePrice = item.product!.nonMemberPrice!;
      }

      return {
        'item': item,
        'framePriceCalculated': framePrice,
      };
    }).toList();
  }

  List<Map<String, dynamic>> get buy1Get1Items {
    final list = <Map<String, dynamic>>[];
    if (_hasUsedBogoThisMonth || !isMember) return list;

    for (final pricing in itemsWithPricing) {
      final CartItem item = pricing['item'] as CartItem;
      final double framePriceCalculated = pricing['framePriceCalculated'] as double;
      if (item.product?.buy1Get1 == true) {
        for (int index = 0; index < item.qty; index++) {
          list.add({
            'id': '${item.id}_$index',
            'framePrice': framePriceCalculated,
            'lensPrice': item.lensPrice ?? 0.0,
          });
        }
      }
    }
    return list;
  }

  Map<String, dynamic> get bogoDetails {
    double bogoDiscount = 0.0;
    String freeItemUniqueKey = '';
    final bogoItems = buy1Get1Items;
    if (bogoItems.length >= 2) {
      // Sort descending by total price (framePrice + lensPrice)
      bogoItems.sort((a, b) {
        final aTotal = (a['framePrice'] as double) + (a['lensPrice'] as double);
        final bTotal = (b['framePrice'] as double) + (b['lensPrice'] as double);
        return bTotal.compareTo(aTotal);
      });

      // Find the lowest price item (which will be free)
      final lowest = bogoItems.reduce((curr, next) {
        final currTotal = (curr['framePrice'] as double) + (curr['lensPrice'] as double);
        final nextTotal = (next['framePrice'] as double) + (next['lensPrice'] as double);
        return currTotal < nextTotal ? curr : next;
      });

      bogoDiscount = (lowest['framePrice'] as double) + (lowest['lensPrice'] as double);
      freeItemUniqueKey = lowest['id'] as String;
    }
    return {
      'bogoDiscount': bogoDiscount,
      'freeItemUniqueKey': freeItemUniqueKey,
    };
  }

  double get bogoDiscount => bogoDetails['bogoDiscount'] as double;
  String get freeItemUniqueKey => bogoDetails['freeItemUniqueKey'] as String;

  double get itemsSubtotal => itemsWithPricing.fold(0.0, (s, pricing) {
        final item = pricing['item'] as CartItem;
        final originalFramePrice = item.product?.nonMemberPrice ?? item.product?.sellingPrice ?? item.framePrice;
        return s + (originalFramePrice + (item.lensPrice ?? 0.0)) * item.qty;
      });

  double get actualSubtotal => itemsWithPricing.fold(0.0, (s, pricing) {
        final item = pricing['item'] as CartItem;
        final framePriceCalculated = pricing['framePriceCalculated'] as double;
        return s + (framePriceCalculated + (item.lensPrice ?? 0.0)) * item.qty;
      });

  double get productDiscounts => itemsWithPricing.fold(0.0, (s, pricing) {
        final item = pricing['item'] as CartItem;
        final framePriceCalculated = pricing['framePriceCalculated'] as double;
        final originalFramePrice = item.product?.nonMemberPrice ?? item.product?.sellingPrice ?? item.framePrice;
        final diff = originalFramePrice - framePriceCalculated;
        return s + (diff > 0.0 ? diff : 0.0) * item.qty;
      });

  double get fittingFeeTotal {
    int lensItemsCount = itemsWithPricing.fold(0, (sum, pricing) {
      final item = pricing['item'] as CartItem;
      final hasLens = (item.lensPrice != null && item.lensPrice! > 0) || item.lensType != null;
      return sum + (hasLens ? item.qty : 0);
    });
    return lensItemsCount == 0 ? 0.0 : lensItemsCount == 1 ? 99.0 : 199.0;
  }

  double get delivery => _items.isNotEmpty ? (isMember ? 0.0 : 99.0) : 0.0;

  double get membershipFee => (_addGoldMembership && _authService.currentUser?.membershipActive != true) ? 129.0 : 0.0;

  double get totalDiscount => _couponDiscount + bogoDiscount + productDiscounts;

  double get totalBeforeDiscount => itemsSubtotal + fittingFeeTotal + delivery + membershipFee;

  double get totalPayable => (totalBeforeDiscount - totalDiscount).clamp(0.0, double.infinity);

  // Backward compatibility getters
  double get subtotal => itemsSubtotal;
  double get productDiscount => productDiscounts;
  double get fittingFee => fittingFeeTotal;
  double get total => totalPayable;

  Future<void> validateCouponCode(String code) async {
    if (isBogoActive) {
      _couponError = 'Standard coupons cannot be combined with Buy 1 Get 1 Membership offer.';
      notifyListeners();
      return;
    }
    _couponError = null;
    _couponSuccessMessage = null;
    _appliedCouponCode = null;
    _couponDiscount = 0.0;
    notifyListeners();

    if (code.isEmpty) return;

    try {
      final api = ApiService(_authService);
      final itemsPayload = itemsWithPricing.map((pricing) {
        final item = pricing['item'] as CartItem;
        final framePriceCalculated = pricing['framePriceCalculated'] as double;
        return {
          'productId': item.product?.id ?? item.id,
          'qty': item.qty,
          'price': framePriceCalculated + (item.lensPrice ?? 0.0),
          'category': item.product?.categories.isNotEmpty == true ? item.product?.categories.first : null,
          'brand': item.product?.brand,
        };
      }).toList();

      final res = await api.validateCartCoupon(
        code: code.trim().toUpperCase(),
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        addGoldMembership: _addGoldMembership,
        items: itemsPayload,
      );

      if (res['valid'] == true) {
        _couponDiscount = (res['discount'] as num).toDouble();
        _appliedCouponCode = code.trim().toUpperCase();
        _couponSuccessMessage = res['message'] ?? 'Coupon applied successfully!';
        _userRemovedCoupon = false;
      } else {
        _couponError = res['message'] ?? 'Invalid coupon code';
      }
    } catch (e) {
      _couponError = 'Failed to validate coupon: $e';
    } finally {
      notifyListeners();
    }
  }

  Future<void> autoApplyBestCoupon() async {
    if (isBogoActive) return;
    _couponError = null;
    _couponSuccessMessage = null;

    try {
      final api = ApiService(_authService);
      final itemsPayload = itemsWithPricing.map((pricing) {
        final item = pricing['item'] as CartItem;
        final framePriceCalculated = pricing['framePriceCalculated'] as double;
        return {
          'productId': item.product?.id ?? item.id,
          'qty': item.qty,
          'price': framePriceCalculated + (item.lensPrice ?? 0.0),
          'category': item.product?.categories.isNotEmpty == true ? item.product?.categories.first : null,
          'brand': item.product?.brand,
        };
      }).toList();

      final res = await api.autoApplyCoupon(
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        addGoldMembership: _addGoldMembership,
        items: itemsPayload,
      );

      if (res['valid'] == true && res['discountAmount'] != null) {
        _couponDiscount = (res['discountAmount'] as num).toDouble();
        _appliedCouponCode = (res['coupon']?['code'] ?? '').toString();
        _couponSuccessMessage = res['message'] ?? 'Auto-applied the best coupon!';
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to auto-apply best coupon: $e');
      }
    } finally {
      notifyListeners();
    }
  }

  void removeCouponCode() {
    _couponDiscount = 0.0;
    _appliedCouponCode = null;
    _couponError = null;
    _couponSuccessMessage = null;
    _userRemovedCoupon = true;
    notifyListeners();
  }

  Future<void> _revalidateCouponIfNeeded() async {
    if (isBogoActive) {
      if (_appliedCouponCode != null) {
        _couponDiscount = 0.0;
        _appliedCouponCode = null;
        _couponSuccessMessage = null;
        _couponError = 'Standard coupons cannot be combined with Buy 1 Get 1 Membership offer.';
      }
      return;
    }

    if (_appliedCouponCode != null) {
      try {
        final api = ApiService(_authService);
        final itemsPayload = itemsWithPricing.map((pricing) {
          final item = pricing['item'] as CartItem;
          final framePriceCalculated = pricing['framePriceCalculated'] as double;
          return {
            'productId': item.product?.id ?? item.id,
            'qty': item.qty,
            'price': framePriceCalculated + (item.lensPrice ?? 0.0),
            'category': item.product?.categories.isNotEmpty == true ? item.product?.categories.first : null,
            'brand': item.product?.brand,
          };
        }).toList();

        final res = await api.validateCartCoupon(
          code: _appliedCouponCode!,
          cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
          addGoldMembership: _addGoldMembership,
          items: itemsPayload,
        );

        if (res['valid'] == true) {
          _couponDiscount = (res['discount'] as num).toDouble();
        } else {
          _couponDiscount = 0.0;
          _appliedCouponCode = null;
          _couponSuccessMessage = null;
          _couponError = 'Coupon removed: ${res['message'] ?? 'Invalid'}';
        }
      } catch (_) {
        _couponDiscount = 0.0;
        _appliedCouponCode = null;
        _couponSuccessMessage = null;
      }
    } else if (!_userRemovedCoupon && _items.isNotEmpty) {
      await autoApplyBestCoupon();
    }
  }

  void _onAuthChanged() {
    if (_authService.isLoggedIn) {
      _syncGuestCartToBackend();
    } else {
      _loadLocalCart();
    }
  }

  Future<void> _loadLocalCart() async {
    _loading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartStr = prefs.getString('guest_cart');
      if (cartStr != null) {
        final List<dynamic> list = jsonDecode(cartStr);
        _items = list.map((json) => CartItem.fromJson(json)).toList();
      } else {
        _items = [];
      }
      await _revalidateCouponIfNeeded();
    } catch (e) {
      if (kDebugMode) {
        print('Error loading guest cart: $e');
      }
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _saveLocalCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = _items.map((item) {
        return {
          'id': item.id,
          'product': item.product?.toJson(),
          'qty': item.qty,
          'color': item.selectedColor,
          'lensType': item.lensType,
          'lensSubType': item.lensSubType,
          'lensQuality': item.lensQuality,
          'power': item.lensConfig?.toJson(),
          'framePrice': item.framePrice,
          'lensPrice': item.lensPrice,
          'fittingCharge': item.fittingCharge,
        };
      }).toList();
      await prefs.setString('guest_cart', jsonEncode(list));
    } catch (e) {
      if (kDebugMode) {
        print('Error saving guest cart: $e');
      }
    }
  }

  Future<void> _addGuestCartItem(Map<String, dynamic> payload) async {
    _loading = true;
    notifyListeners();
    try {
      final api = ApiService(_authService);
      final productId = payload['productId'] ?? '';
      
      // Unpack nested 'lens' if present
      final lensMap = payload['lens'] as Map<String, dynamic>?;
      final String? lensType = lensMap != null ? lensMap['lensType'] as String? : payload['lensType'] as String?;
      final String? lensSubType = lensMap != null ? lensMap['lensSubType'] as String? : payload['lensSubType'] as String?;
      final String? lensQuality = lensMap != null ? lensMap['lensQuality'] as String? : payload['lensQuality'] as String?;
      final double? lensPrice = lensMap != null 
          ? (lensMap['lensPrice'] as num?)?.toDouble() 
          : (payload['lensPrice'] as num?)?.toDouble();
      final Map<String, dynamic>? powerMap = lensMap != null 
          ? lensMap['power'] as Map<String, dynamic>? 
          : payload['power'] as Map<String, dynamic>?;

      // Fetch product details
      final prodData = await api.getProduct(productId);
      final productMap = prodData['product'] ?? prodData['data'];
      if (productMap == null) return;
      final product = Product.fromJson(productMap);

      // Check if item already exists
      final existingIndex = _items.indexWhere((item) =>
          item.product?.id == productId &&
          item.selectedColor == payload['color'] &&
          item.lensType == lensType &&
          item.lensSubType == lensSubType &&
          item.lensQuality == lensQuality);

      if (existingIndex >= 0) {
        final current = _items[existingIndex];
        _items[existingIndex] = CartItem(
          id: current.id,
          product: current.product,
          qty: current.qty + (payload['qty'] as int? ?? 1),
          selectedColor: current.selectedColor,
          lensType: current.lensType,
          lensSubType: current.lensSubType,
          lensQuality: current.lensQuality,
          lensConfig: current.lensConfig,
          framePrice: current.framePrice,
          lensPrice: current.lensPrice,
          fittingCharge: current.fittingCharge,
        );
      } else {
        final framePrice = (product.sellingPrice).toDouble();
        
        _items.add(CartItem(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          product: product,
          qty: payload['qty'] as int? ?? 1,
          selectedColor: payload['color'],
          lensType: lensType,
          lensSubType: lensSubType,
          lensQuality: lensQuality,
          lensConfig: powerMap != null ? PrescriptionData.fromJson(powerMap) : null,
          framePrice: framePrice,
          lensPrice: lensPrice,
          fittingCharge: payload['fittingCharge'] != null 
              ? (payload['fittingCharge'] as num?)?.toDouble() 
              : (lensPrice != null ? 199.0 : 0.0),
        ));
      }
      
      await _saveLocalCart();
      await _revalidateCouponIfNeeded();
    } catch (e) {
      if (kDebugMode) {
        print('Error adding to guest cart: $e');
      }
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _syncGuestCartToBackend() async {
    _loading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartStr = prefs.getString('guest_cart');
      if (cartStr != null) {
        final List<dynamic> list = jsonDecode(cartStr);
        final api = ApiService(_authService);
        
        for (var itemJson in list) {
          final lensConfig = itemJson['lensType'] != null
              ? {
                  'lensType': itemJson['lensType'],
                  'lensSubType': itemJson['lensSubType'],
                  'lensQuality': itemJson['lensQuality'],
                  'lensPrice': itemJson['lensPrice'],
                  'power': itemJson['power'],
                }
              : null;
          final payload = {
            'productId': itemJson['product']?['_id'] ?? itemJson['product']?['id'] ?? '',
            'qty': itemJson['qty'] ?? 1,
            'color': itemJson['color'],
            'lens': lensConfig,
          };
          await api.addToCart(payload);
        }
        if (_addGoldMembership) {
          await api.updateCartMembership(true);
        }
        await prefs.remove('guest_cart');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error syncing guest cart to backend: $e');
      }
    } finally {
      await loadCart();
    }
  }

  Future<void> loadCart() async {
    if (!_authService.isLoggedIn) {
      await _loadLocalCart();
      return;
    }
    _loading = true;
    notifyListeners();
    try {
      final api = ApiService(_authService);
      final data = await api.getCart();
      final cartItems = ((data['cart'] as Map?)?['items'] ?? data['items'] ?? []) as List;
      _items = cartItems.map((i) => CartItem.fromJson(i)).toList();
      _hasUsedBogoThisMonth = (data['cart'] as Map?)?['hasUsedBogoThisMonth'] == true;
      _addGoldMembership = (data['cart'] as Map?)?['addGoldMembership'] == true;
      await _revalidateCouponIfNeeded();
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
    if (!_authService.isLoggedIn) {
      await _addGuestCartItem(itemPayload);
      return;
    }
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
    if (!_authService.isLoggedIn) {
      _items.removeWhere((item) => item.id == itemId);
      await _saveLocalCart();
      await _revalidateCouponIfNeeded();
      notifyListeners();
      return;
    }
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
    if (!_authService.isLoggedIn) {
      final idx = _items.indexWhere((item) => item.id == itemId);
      if (idx >= 0) {
        final current = _items[idx];
        _items[idx] = CartItem(
          id: current.id,
          product: current.product,
          qty: data['qty'] ?? current.qty,
          selectedColor: current.selectedColor,
          lensType: current.lensType,
          lensSubType: current.lensSubType,
          lensQuality: current.lensQuality,
          lensConfig: current.lensConfig,
          framePrice: current.framePrice,
          lensPrice: current.lensPrice,
          fittingCharge: current.fittingCharge,
        );
        await _saveLocalCart();
        await _revalidateCouponIfNeeded();
        notifyListeners();
      }
      return;
    }
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
