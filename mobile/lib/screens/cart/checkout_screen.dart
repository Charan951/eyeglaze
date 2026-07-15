import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/app_config.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/cart_provider.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/trust_strip.dart';
import '../../models/cart_item.dart';
import '../../models/user.dart';
import '../orders/orders_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _getLensText(CartItem item) {
    if (item.lensType != null) {
      final typeStr = item.lensType!.replaceAll('_', ' ').toUpperCase();
      final detailStr = item.lensSubType != null
          ? item.lensSubType!.replaceAll('_', ' ').toUpperCase()
          : (item.lensQuality ?? '');
      return '$typeStr ($detailStr)';
    }
    return '';
  }

  // Loading & submissions state
  bool _loading = true;
  bool _submitting = false;
  List<CartItem> _items = [];

  // Form controllers
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _altPhoneCtrl = TextEditingController();
  final _line1Ctrl = TextEditingController();
  final _line2Ctrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();

  // Coupon State
  final _couponCtrl = TextEditingController();
  bool _couponApplied = false;
  double _couponDiscount = 0.0;
  String _appliedCouponCode = '';
  String _couponError = '';
  String _couponSuccessMessage = '';
  bool _validatingCoupon = false;

  // Active coupons loaded from backend
  List<dynamic> _activeCoupons = [];

  // Address selection state
  bool _isNewAddressActive = false;
  String _selectedAddressId = '';

  // Wallet State
  bool _useWallet = false;

  // Payment Selection
  String _paymentMethod = 'cod'; // cod, card, upi

  // Dropdown states for summary
  bool _showItemDropdown = false;
  bool _showDiscountDropdown = false;

  // Success state details
  bool _orderSuccess = false;
  String _successOrderId = '';
  double _successTotal = 0;
  String _successDeliveryDate = '';

  @override
  void initState() {
    super.initState();
    _loadCartAndAddresses();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _altPhoneCtrl.dispose();
    _line1Ctrl.dispose();
    _line2Ctrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _couponCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCartAndAddresses() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      
      // Load cart items
      final cartData = await api.getCart();
      final cartItems = ((cartData['cart'] as Map?)?['items'] ?? cartData['items'] ?? []) as List;
      _items = cartItems.map((i) => CartItem.fromJson(i)).toList();

      // Fetch coupons
      try {
        final couponRes = await api.getActiveCoupons();
        _activeCoupons = (couponRes['coupons'] ?? couponRes['data'] ?? []) as List;
      } catch (_) {}

      // Pre-fill default address from user profile
      final user = auth.currentUser;
      if (user != null && user.addresses.isNotEmpty) {
        _isNewAddressActive = false;
        // Find default or select the first address
        dynamic defaultAddr;
        for (final addr in user.addresses) {
          if (addr.isDefault == true) {
            defaultAddr = addr;
            break;
          }
        }
        defaultAddr ??= user.addresses.first;
        _selectedAddressId = defaultAddr.id;
        _fillAddress(defaultAddr);
      } else {
        _isNewAddressActive = true;
      }
    } catch (_) {
      // Error handling
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _fillAddress(dynamic addr) {
    _nameCtrl.text = addr.fullName ?? '';
    _phoneCtrl.text = addr.mobile ?? '';
    _altPhoneCtrl.text = addr.alternativeNumber ?? '';
    _line1Ctrl.text = addr.line1 ?? '';
    _line2Ctrl.text = addr.line2 ?? '';
    _cityCtrl.text = addr.city ?? '';
    _stateCtrl.text = addr.state ?? '';
    _pincodeCtrl.text = addr.pincode ?? '';
  }

  double get _subtotal {
    final cart = context.read<CartProvider>();
    return cart.itemsSubtotal;
  }

  double get _productDiscount {
    final cart = context.read<CartProvider>();
    return cart.productDiscounts;
  }

  double get _fittingFee {
    final cart = context.read<CartProvider>();
    return cart.fittingFeeTotal;
  }

  double get _delivery {
    final cart = context.read<CartProvider>();
    return cart.delivery;
  }

  double get _bogoDiscount {
    final cart = context.read<CartProvider>();
    return cart.bogoDiscount;
  }

  double get _membershipFee {
    final cart = context.read<CartProvider>();
    return cart.membershipFee;
  }

  double get _total => _subtotal + _fittingFee + _delivery + _membershipFee - _productDiscount - _bogoDiscount;

  double get _walletDeduction {
    if (!_useWallet) return 0.0;
    final user = context.read<AuthService>().currentUser;
    if (user == null) return 0.0;
    final remainingAfterCoupon = _total - _couponDiscount;
    return remainingAfterCoupon > user.walletBalance
        ? user.walletBalance
        : remainingAfterCoupon;
  }

  double get _finalTotal => _total - _couponDiscount - _walletDeduction;

  Future<void> _validateCoupon() async {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) return;

    setState(() {
      _validatingCoupon = true;
      _couponError = '';
      _couponSuccessMessage = '';
    });

    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final res = await api.validateCoupon(code, _subtotal + _fittingFee - _productDiscount);
      if (res['valid'] == true) {
        setState(() {
          _couponApplied = true;
          _appliedCouponCode = code.toUpperCase();
          _couponDiscount = (res['discount'] as num).toDouble();
          _couponSuccessMessage = res['message'] ?? 'Coupon applied successfully!';
        });
      } else {
        setState(() {
          _couponError = res['message'] ?? 'Invalid coupon code';
          _couponApplied = false;
          _appliedCouponCode = '';
          _couponDiscount = 0.0;
        });
      }
    } catch (e) {
      setState(() {
        _couponError = 'Failed to validate coupon';
      });
    } finally {
      setState(() {
        _validatingCoupon = false;
      });
    }
  }

  void _removeCoupon() {
    setState(() {
      _couponApplied = false;
      _appliedCouponCode = '';
      _couponDiscount = 0.0;
      _couponCtrl.clear();
      _couponSuccessMessage = '';
      _couponError = '';
    });
  }

  void _openCouponSelectionSheet() {
    if (_couponApplied) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              decoration: const BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 36, height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('Select Coupon', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                          SizedBox(height: 2),
                          Text('Choose an active offer to save on your order', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.white, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _couponCtrl,
                          textCapitalization: TextCapitalization.characters,
                          style: const TextStyle(color: AppColors.white, fontSize: 13, fontFamily: 'monospace'),
                          decoration: InputDecoration(
                            hintText: 'ENTER COUPON CODE',
                            hintStyle: const TextStyle(color: AppColors.muted, fontSize: 12),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            filled: true,
                            fillColor: AppColors.background,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.gold)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _validatingCoupon
                            ? null
                            : () async {
                                final code = _couponCtrl.text.trim();
                                if (code.isEmpty) return;
                                setSheetState(() => _validatingCoupon = true);
                                await _validateCoupon();
                                setSheetState(() => _validatingCoupon = false);
                                if (_couponApplied) {
                                  if (mounted) setState(() {});
                                  Navigator.pop(context);
                                } else {
                                  setSheetState(() {});
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          minimumSize: Size.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: _validatingCoupon
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 1.5))
                            : const Text('APPLY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                  if (_couponError.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(_couponError, style: const TextStyle(color: AppColors.error, fontSize: 11)),
                  ],
                  const SizedBox(height: 16),
                  ConstrainedBox(
                    constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.45),
                    child: _activeCoupons.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24),
                            child: Center(child: Text('No active coupons available right now', style: TextStyle(color: AppColors.muted, fontSize: 12))),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            itemCount: _activeCoupons.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final coupon = _activeCoupons[index];
                              final code = (coupon['code'] ?? '').toString();
                              final description = (coupon['description'] ?? '').toString();
                              final badge = coupon['badge']?.toString();
                              final minOrderValue = coupon['minOrderValue'];
                              final maxDiscount = coupon['maxDiscount'];
                              final isApplied = _appliedCouponCode == code;
                              
                              return Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF161618),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isApplied ? AppColors.success.withValues(alpha: 0.5) : AppColors.border,
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Positioned(
                                      left: -6, top: 0, bottom: 0,
                                      child: Center(
                                        child: Container(
                                          width: 12, height: 12,
                                          decoration: const BoxDecoration(color: AppColors.card, shape: BoxShape.circle),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      right: -6, top: 0, bottom: 0,
                                      child: Center(
                                        child: Container(
                                          width: 12, height: 12,
                                          decoration: const BoxDecoration(color: AppColors.card, shape: BoxShape.circle),
                                        ),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(14),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                if (badge != null && badge.isNotEmpty) ...[
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: AppColors.gold.withValues(alpha: 0.15),
                                                      borderRadius: BorderRadius.circular(4),
                                                      border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
                                                    ),
                                                    child: Text(
                                                      badge.toUpperCase(),
                                                      style: const TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                                                    ),
                                                  ),
                                                  const SizedBox(height: 6),
                                                ],
                                                Text(code, style: const TextStyle(color: AppColors.white, fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
                                                const SizedBox(height: 4),
                                                Text(description, style: const TextStyle(color: AppColors.muted, fontSize: 10, height: 1.3)),
                                                if (minOrderValue != null || maxDiscount != null) ...[
                                                  const SizedBox(height: 6),
                                                  Row(
                                                    children: [
                                                      if (minOrderValue != null) ...[
                                                        Text('MIN PURCHASE: ₹$minOrderValue', style: const TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.bold)),
                                                        if (maxDiscount != null) const SizedBox(width: 8),
                                                      ],
                                                      if (maxDiscount != null)
                                                        Text('MAX DISCOUNT: ₹$maxDiscount', style: const TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.bold)),
                                                    ],
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          ElevatedButton(
                                            onPressed: () async {
                                              setSheetState(() => _validatingCoupon = true);
                                              if (isApplied) {
                                                _removeCoupon();
                                              } else {
                                                _couponCtrl.text = code;
                                                await _validateCoupon();
                                              }
                                              setSheetState(() => _validatingCoupon = false);
                                              if (_couponApplied || isApplied) {
                                                if (mounted) setState(() {});
                                                Navigator.pop(context);
                                              } else {
                                                setSheetState(() {});
                                              }
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: isApplied ? AppColors.success : AppColors.gold,
                                              foregroundColor: isApplied ? AppColors.white : Colors.black,
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                              minimumSize: Size.zero,
                                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                            ),
                                            child: Text(
                                              isApplied ? 'Applied ✓' : 'Apply',
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete the shipping address fields'), backgroundColor: AppColors.error),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthService>();
      final cartProvider = context.read<CartProvider>();
      final api = ApiService(auth);

      final payload = {
        'deliveryAddress': {
          'fullName': _nameCtrl.text.trim(),
          'mobile': _phoneCtrl.text.trim(),
          if (_altPhoneCtrl.text.trim().isNotEmpty) 'alternativeNumber': _altPhoneCtrl.text.trim(),
          'line1': _line1Ctrl.text.trim(),
          'line2': _line2Ctrl.text.trim(),
          'city': _cityCtrl.text.trim(),
          'state': _stateCtrl.text.trim(),
          'pincode': _pincodeCtrl.text.trim(),
        },
        'paymentMethod': _finalTotal == 0 ? 'wallet' : _paymentMethod,
        'paymentStatus': 'paid',
        if (_appliedCouponCode.isNotEmpty) 'couponCode': _appliedCouponCode,
        if (_useWallet && _walletDeduction > 0) 'walletUsed': _walletDeduction,
      };

      final response = await api.createOrder(payload);
      if (response['orderId'] != null) {
        // Clear local cart state
        try {
          cartProvider.clearCartLocal();
        } catch (_) {}

        // Refresh profile to update wallet balance in local state
        try {
          final profileRes = await api.getProfile();
          if (profileRes['user'] != null) {
            auth.setUser(User.fromJson(profileRes['user']));
          }
        } catch (_) {}

        final estDelivery = response['estimatedDelivery'] != null
            ? DateTime.parse(response['estimatedDelivery'])
            : DateTime.now().add(const Duration(days: 5));
        
        final formatter = DateFormat('EEEE, d MMMM yyyy');

        setState(() {
          _orderSuccess = true;
          _successOrderId = response['orderId'];
          _successTotal = (response['total'] ?? _finalTotal).toDouble();
          _successDeliveryDate = formatter.format(estDelivery);
        });
      } else {
        throw Exception(response['error'] ?? 'Order placement failed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to place order: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.gold)),
      );
    }

    if (_orderSuccess) {
      return _buildSuccessScreen();
    }

    final auth = context.watch<AuthService>();
    final user = auth.currentUser;
    final cart = context.watch<CartProvider>();

    final List<Map<String, dynamic>> flattenedItems = [];
    final freeKey = cart.freeItemUniqueKey;

    for (final pricing in cart.itemsWithPricing) {
      final CartItem item = pricing['item'] as CartItem;
      final double framePriceCalculated = pricing['framePriceCalculated'] as double;
      for (int index = 0; index < item.qty; index++) {
        final uniqueKey = '${item.id}_$index';
        flattenedItems.add({
          'item': item,
          'name': item.product?.name ?? 'Frame',
          'sku': item.product?.sku ?? '',
          'color': item.selectedColor ?? '',
          'qty': 1,
          'totalPrice': framePriceCalculated + (item.lensPrice ?? 0.0),
          'isFree': uniqueKey == freeKey,
          'image': item.product != null &&
                  ((item.product!.thumbnail != null && item.product!.thumbnail!.isNotEmpty) ||
                   item.product!.images.isNotEmpty)
              ? ((item.product!.thumbnail != null && item.product!.thumbnail!.isNotEmpty)
                  ? item.product!.thumbnail!
                  : item.product!.images.first)
              : null,
          'isPseudo': false,
        });
      }
    }

    if (cart.addGoldMembership && cart.items.isNotEmpty && user?.membershipActive != true) {
      flattenedItems.add({
        'id': 'gold_membership_pseudo',
        'name': 'EyeGlaze Gold Membership',
        'sku': 'MEMBERSHIP-GOLD-1YR',
        'color': 'Gold',
        'qty': 1,
        'totalPrice': 129.0,
        'isFree': false,
        'image': null,
        'isPseudo': true,
      });
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Secure Checkout', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Shipping Address Section
              const Text('SHIPPING ADDRESS', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
              const SizedBox(height: 12),
              
              // Saved Addresses Selection Carousel
              if (user != null && user.addresses.isNotEmpty) ...[
                const Text('Saved Addresses', style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                SizedBox(
                  height: 94,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: user.addresses.length + 1,
                    itemBuilder: (context, i) {
                      if (i == user.addresses.length) {
                        final isSelected = _isNewAddressActive;
                        return GestureDetector(
                          onTap: () => setState(() {
                            _isNewAddressActive = true;
                            _selectedAddressId = '';
                            _nameCtrl.clear();
                            _phoneCtrl.clear();
                            _line1Ctrl.clear();
                            _line2Ctrl.clear();
                            _cityCtrl.clear();
                            _stateCtrl.clear();
                            _pincodeCtrl.clear();
                          }),
                          child: Container(
                            width: 120,
                            margin: const EdgeInsets.only(right: 10),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? AppColors.gold : AppColors.border,
                                width: isSelected ? 1.5 : 1.0,
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(Icons.add, color: AppColors.gold, size: 24),
                                SizedBox(height: 6),
                                Text('Add New', style: TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        );
                      }

                      final addr = user.addresses[i];
                      final isSelected = !_isNewAddressActive && _selectedAddressId == addr.id;
                      return GestureDetector(
                        onTap: () => setState(() {
                          _isNewAddressActive = false;
                          _selectedAddressId = addr.id;
                          _fillAddress(addr);
                        }),
                        child: Container(
                          width: 170,
                          margin: const EdgeInsets.only(right: 10),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected ? AppColors.gold : AppColors.border,
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                    decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(4)),
                                    child: Text(addr.type?.toUpperCase() ?? 'HOME', style: const TextStyle(color: AppColors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                                  ),
                                  const Spacer(),
                                  if (addr.isDefault == true)
                                    const Text('Default', style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(addr.fullName ?? '', style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 2),
                              Text('${addr.line1}, ${addr.city}', style: const TextStyle(color: AppColors.muted, fontSize: 10), maxLines: 2, overflow: TextOverflow.ellipsis),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // Conditional Display: Delivery Address summary or fields form
              if (!_isNewAddressActive) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.location_on_outlined, color: AppColors.gold, size: 18),
                          SizedBox(width: 6),
                          Text('DELIVERY ADDRESS', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.5)),
                        ],
                      ),
                      const Divider(color: AppColors.border, height: 20),
                      Text(_nameCtrl.text, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 4),
                      Text(
                        '+91 ${_phoneCtrl.text}${_altPhoneCtrl.text.isNotEmpty ? ' · Alt: +91 ${_altPhoneCtrl.text}' : ''}',
                        style: const TextStyle(color: AppColors.muted, fontSize: 11),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${_line1Ctrl.text}${_line2Ctrl.text.isNotEmpty ? ', ' + _line2Ctrl.text : ''}\n'
                        '${_cityCtrl.text}, ${_stateCtrl.text} - ${_pincodeCtrl.text}',
                        style: const TextStyle(color: AppColors.muted, fontSize: 11, height: 1.4),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ] else ...[
                const Text('ENTER NEW ADDRESS', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _nameCtrl,
                  style: const TextStyle(color: AppColors.white),
                  decoration: const InputDecoration(labelText: 'Full Name *'),
                  validator: (val) => val == null || val.isEmpty ? 'Required field' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneCtrl,
                  style: const TextStyle(color: AppColors.white),
                  decoration: const InputDecoration(labelText: 'Mobile Number *', prefixText: '+91 '),
                  keyboardType: TextInputType.phone,
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Required field';
                    final digitsOnly = val.replaceAll(RegExp(r'[^0-9]'), '');
                    String clean = digitsOnly;
                    if (clean.startsWith('91') && clean.length == 12) {
                      clean = clean.substring(2);
                    }
                    if (clean.length != 10) {
                      return 'Enter a valid 10-digit number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _altPhoneCtrl,
                  style: const TextStyle(color: AppColors.white),
                  decoration: const InputDecoration(labelText: 'Alternative Number (Optional)', prefixText: '+91 '),
                  keyboardType: TextInputType.phone,
                  validator: (val) {
                    if (val == null || val.isEmpty) return null;
                    final digitsOnly = val.replaceAll(RegExp(r'[^0-9]'), '');
                    String clean = digitsOnly;
                    if (clean.startsWith('91') && clean.length == 12) {
                      clean = clean.substring(2);
                    }
                    if (clean.length != 10) {
                      return 'Enter a valid 10-digit number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _line1Ctrl,
                  style: const TextStyle(color: AppColors.white),
                  decoration: const InputDecoration(labelText: 'Flat, House no., Apartment *'),
                  validator: (val) => val == null || val.isEmpty ? 'Required field' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _line2Ctrl,
                  style: const TextStyle(color: AppColors.white),
                  decoration: const InputDecoration(labelText: 'Area, Street, Sector (Optional)'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _cityCtrl,
                        style: const TextStyle(color: AppColors.white),
                        decoration: const InputDecoration(labelText: 'City *'),
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _stateCtrl,
                        style: const TextStyle(color: AppColors.white),
                        decoration: const InputDecoration(labelText: 'State *'),
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _pincodeCtrl,
                  style: const TextStyle(color: AppColors.white),
                  decoration: const InputDecoration(labelText: 'Pincode *'),
                  keyboardType: TextInputType.number,
                  validator: (val) => val == null || val.length != 6 ? 'Enter a 6-digit code' : null,
                ),
                const SizedBox(height: 24),
              ],

              // Coupon / Promo Section
              const Text('PROMO CODE', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: _openCouponSelectionSheet,
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _couponApplied ? AppColors.success.withValues(alpha: 0.05) : AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _couponApplied ? AppColors.success.withValues(alpha: 0.5) : AppColors.border,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Text('🎫', style: TextStyle(fontSize: 20)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _couponApplied ? 'COUPON: $_appliedCouponCode' : 'Apply Coupon',
                              style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _couponApplied ? 'Saved ₹${_couponDiscount.toInt()}!' : 'Check available offers',
                              style: const TextStyle(color: AppColors.muted, fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                      if (_couponApplied)
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _removeCoupon();
                            });
                          },
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'REMOVE',
                            style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 0.5),
                          ),
                        )
                      else
                        const Icon(Icons.arrow_forward_ios, color: AppColors.muted, size: 14),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Wallet Section
              const Text('EYEGLAZE WALLET', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.account_balance_wallet_outlined, color: AppColors.gold, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Apply Wallet Balance', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                              Text('Available Balance: ₹${user?.walletBalance.toInt() ?? 0}', style: AppTextStyles.muted),
                            ],
                          ),
                        ),
                        Switch(
                          value: _useWallet,
                          activeThumbColor: AppColors.gold,
                          activeTrackColor: AppColors.gold.withValues(alpha: 0.3),
                          inactiveThumbColor: AppColors.muted,
                          inactiveTrackColor: Colors.white10,
                          onChanged: (user?.walletBalance ?? 0) > 0
                              ? (val) => setState(() => _useWallet = val)
                              : null,
                        ),
                      ],
                    ),
                    if (_useWallet && _walletDeduction > 0) ...[
                      const Divider(color: AppColors.border),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Text('Deducting from Wallet', style: TextStyle(color: AppColors.success, fontSize: 12)),
                            const Spacer(),
                            Text('-₹${_walletDeduction.toInt()}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 2. Payment Method
              if (_finalTotal > 0) ...[
                const Text('PAYMENT METHOD', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      RadioListTile<String>(
                        title: const Text('Cash on Delivery (COD)', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        subtitle: const Text('Pay with cash upon package arrival', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                        value: 'cod',
                        groupValue: _paymentMethod,
                        onChanged: (val) => setState(() => _paymentMethod = val!),
                        activeColor: AppColors.gold,
                      ),
                      const Divider(color: AppColors.border, height: 1),
                      RadioListTile<String>(
                        title: const Text('Credit / Debit Card', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        subtitle: const Text('Secure payment via Visa, Mastercard, RuPay', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                        value: 'card',
                        groupValue: _paymentMethod,
                        onChanged: (val) => setState(() => _paymentMethod = val!),
                        activeColor: AppColors.gold,
                      ),
                      const Divider(color: AppColors.border, height: 1),
                      RadioListTile<String>(
                        title: const Text('UPI / NetBanking', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        subtitle: const Text('Instant transfer via GPay, PhonePe, Paytm', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                        value: 'upi',
                        groupValue: _paymentMethod,
                        onChanged: (val) => setState(() => _paymentMethod = val!),
                        activeColor: AppColors.gold,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // 3. Order Items Summary
              const Text('ORDER SUMMARY', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: flattenedItems.length,
                      itemBuilder: (context, i) {
                        final itemMap = flattenedItems[i];
                        final isPseudo = itemMap['isPseudo'] == true;
                        final isFree = itemMap['isFree'] == true;
                        final double totalPrice = itemMap['totalPrice'] as double;
                        final name = itemMap['name'] as String;
                        final color = itemMap['color'] as String;
                        final image = itemMap['image'] as String?;
                        final CartItem? cartItem = itemMap['item'] as CartItem?;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(6)),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: isPseudo
                                      ? const Center(child: Text('🏆', style: TextStyle(fontSize: 16)))
                                      : (image != null
                                          ? CachedNetworkImage(
                                              imageUrl: AppConfig.resolveImageUrl(image),
                                              fit: BoxFit.contain,
                                              placeholder: (context, url) => const Center(
                                                child: SizedBox(
                                                  width: 14, height: 14,
                                                  child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.0),
                                                ),
                                              ),
                                              errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 16),
                                            )
                                          : const Icon(Icons.visibility_outlined, color: AppColors.muted, size: 20)),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    Text(isPseudo ? '1-Yr Membership' : '$color • Qty 1', style: const TextStyle(color: AppColors.muted, fontSize: 10)),
                                    if (!isPseudo && cartItem != null) ...[
                                      if (cartItem.lensType != null) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          'Lens: ${_getLensText(cartItem)}',
                                          style: const TextStyle(color: AppColors.muted, fontSize: 10),
                                        ),
                                      ],
                                      const SizedBox(height: 2),
                                      Text(
                                        cartItem.lensPrice != null && cartItem.lensPrice! > 0
                                            ? 'Frame: ₹${(totalPrice - cartItem.lensPrice!).toInt()} · Lens: ₹${cartItem.lensPrice!.toInt()}'
                                            : 'Frame: ₹${totalPrice.toInt()}',
                                        style: const TextStyle(color: AppColors.muted, fontSize: 9),
                                      ),
                                    ],
                                    if (isFree) ...[
                                      const SizedBox(height: 2),
                                      const Text('FREE WITH MEMBERSHIP', style: TextStyle(color: AppColors.success, fontSize: 8, fontWeight: FontWeight.bold)),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(isFree ? 'Free' : '₹${totalPrice.toInt()}', style: TextStyle(color: isFree ? AppColors.success : AppColors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        );
                      },
                    ),
                    const Divider(color: AppColors.border),
                                       GestureDetector(
                      onTap: () => setState(() => _showItemDropdown = !_showItemDropdown),
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            const Text('Total Item Price', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                            const SizedBox(width: 4),
                            Icon(
                              _showItemDropdown ? Icons.arrow_drop_down : Icons.arrow_right,
                              color: AppColors.muted,
                              size: 16,
                            ),
                            const Spacer(),
                            Text('₹${_subtotal.toInt()}', style: const TextStyle(color: AppColors.white, fontSize: 12)),
                          ],
                        ),
                      ),
                    ),
                    if (_showItemDropdown)
                      Container(
                        margin: const EdgeInsets.only(left: 4, bottom: 8),
                        padding: const EdgeInsets.only(left: 12),
                        decoration: const BoxDecoration(
                          border: Border(
                            left: BorderSide(color: Colors.white24, width: 1.5),
                          ),
                        ),
                        child: Column(
                          children: cart.itemsWithPricing.map((pricing) {
                            final item = pricing['item'] as CartItem;
                            final originalFramePrice = item.product?.nonMemberPrice ?? item.product?.sellingPrice ?? item.framePrice;
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${item.product?.name ?? 'Frame'} (x${item.qty})',
                                      style: const TextStyle(color: AppColors.muted, fontSize: 11),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '₹${((originalFramePrice + (item.lensPrice ?? 0.0)) * item.qty).toInt()}',
                                    style: const TextStyle(color: AppColors.muted, fontSize: 11),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    if (_fittingFee > 0)
                      _PriceSummaryRow(label: 'Fitting Fee', value: '₹${_fittingFee.toInt()}'),
                    _PriceSummaryRow(label: 'Shipping & Delivery', value: _delivery == 0 ? 'FREE' : '₹${_delivery.toInt()}'),
                    if (_membershipFee > 0)
                      _PriceSummaryRow(label: 'Gold Membership Fee', value: '₹${_membershipFee.toInt()}'),
                    if ((_productDiscount + _bogoDiscount + _couponDiscount) > 0) ...[
                      GestureDetector(
                        onTap: () => setState(() => _showDiscountDropdown = !_showDiscountDropdown),
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: [
                              const Text('Total Discount', style: TextStyle(color: AppColors.success, fontSize: 12)),
                              const SizedBox(width: 4),
                              Icon(
                                _showDiscountDropdown ? Icons.arrow_drop_down : Icons.arrow_right,
                                color: AppColors.success,
                                size: 16,
                              ),
                              const Spacer(),
                              Text('-₹${(_productDiscount + _bogoDiscount + _couponDiscount).toInt()}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                      if (_showDiscountDropdown)
                        Container(
                          margin: const EdgeInsets.only(left: 4, bottom: 8),
                          padding: const EdgeInsets.only(left: 12),
                          decoration: BoxDecoration(
                            border: Border(
                              left: BorderSide(color: AppColors.success.withValues(alpha: 0.5), width: 1.5),
                            ),
                          ),
                          child: Column(
                            children: [
                              if (_productDiscount > 0)
                                _PriceSummaryRow(
                                  label: 'Product Discount',
                                  value: '-₹${_productDiscount.toInt()}',
                                  valueColor: AppColors.success,
                                ),
                              if (_bogoDiscount > 0)
                                _PriceSummaryRow(
                                  label: 'Buy 1 Get 1 Offer',
                                  value: '-₹${_bogoDiscount.toInt()}',
                                  valueColor: AppColors.success,
                                ),
                              if (_couponApplied && _couponDiscount > 0)
                                _PriceSummaryRow(
                                  label: 'Coupon Discount ($_appliedCouponCode)',
                                  value: '-₹${_couponDiscount.toInt()}',
                                  valueColor: AppColors.success,
                                ),
                            ],
                          ),
                        ),
                    ],
                    if (_useWallet && _walletDeduction > 0)
                      _PriceSummaryRow(
                        label: 'Wallet Deduction',
                        value: '-₹${_walletDeduction.toInt()}',
                        valueColor: AppColors.success,
                      ),
                    const Divider(color: AppColors.border),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Text('Total Payable', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                        const Spacer(),
                        Text('₹${_finalTotal.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 18)),
                      ],
                    ),
                  ],
                ),
              ),
              const TrustStrip(),
              const SizedBox(height: 12),
              GoldButton(
                label: _submitting ? 'PLACING ORDER...' : 'PLACE ORDER ✓',
                onPressed: _submitting ? null : _placeOrder,
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessScreen() {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64, height: 64,
                    decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), shape: BoxShape.circle, border: Border.all(color: AppColors.success.withValues(alpha: 0.2))),
                    child: const Icon(Icons.check, color: AppColors.success, size: 36),
                  ),
                  const SizedBox(height: 18),
                  const Text('Order Placed Successfully!', style: AppTextStyles.heading2, textAlign: TextAlign.center),
                  const SizedBox(height: 6),
                  const Text('Thank you for shopping with EyeGlaze. Your order has been registered.', style: TextStyle(color: AppColors.muted, fontSize: 13), textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.background, border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(12)),
                    child: Column(
                      children: [
                        _SuccessDetailsRow('Order ID', _successOrderId, valueColor: AppColors.gold, isFontMono: true),
                        const SizedBox(height: 8),
                        _SuccessDetailsRow('Total Paid', '₹${_successTotal.toInt()}'),
                        const Divider(color: AppColors.border, height: 24),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('ESTIMATED DELIVERY', style: TextStyle(color: AppColors.muted, fontSize: 10, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(_successDeliveryDate, style: const TextStyle(color: AppColors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute(builder: (_) => const OrdersScreen()),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text('VIEW ORDERS', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).popUntil((route) => route.isFirst);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text('SHOP MORE', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PriceSummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _PriceSummaryRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          const Spacer(),
          Text(
            value,
            style: TextStyle(color: valueColor ?? AppColors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _SuccessDetailsRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool isFontMono;
  const _SuccessDetailsRow(this.label, this.value, {this.valueColor, this.isFontMono = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
            fontFamily: isFontMono ? 'monospace' : null,
          ),
        ),
      ],
    );
  }
}
