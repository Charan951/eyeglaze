import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/app_config.dart';
import '../../core/theme.dart';
import '../../models/cart_item.dart';
import '../../services/cart_provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/gold_button.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _showItemDropdown = false;
  bool _showDiscountDropdown = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().loadCart();
    });
  }

  Future<void> _removeItem(CartItem item) async {
    final cart = context.read<CartProvider>();
    if (item.qty > 1) {
      await cart.updateCartItem(item.id, {'qty': item.qty - 1});
    } else {
      await cart.removeFromCart(item.id);
    }
  }

  Future<void> _repeatItem(CartItem item) async {
    final cartProvider = context.read<CartProvider>();
    try {
      final lensConfig = item.lensType != null
          ? {
              'lensType': item.lensType,
              'lensSubType': item.lensSubType,
              'lensQuality': item.lensQuality,
              'lensPrice': item.lensPrice,
              'power': item.lensConfig?.toJson(),
            }
          : null;
      await cartProvider.addToCart({
        'productId': item.product?.id,
        'qty': 1,
        'color': item.selectedColor,
        'lens': lensConfig,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Item duplicated in cart!'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to repeat: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final auth = context.watch<AuthService>();
    final loading = cart.isLoading;
    final user = auth.currentUser;

    final List<Map<String, dynamic>> flattenedItems = [];
    final freeKey = cart.freeItemUniqueKey;

    for (final pricing in cart.itemsWithPricing) {
      final CartItem item = pricing['item'] as CartItem;
      final double framePriceCalculated = pricing['framePriceCalculated'] as double;
      for (int index = 0; index < item.qty; index++) {
        final uniqueKey = '${item.id}_$index';
        flattenedItems.add({
          'item': item,
          'qty': 1,
          'framePriceCalculated': framePriceCalculated,
          'uniqueKey': uniqueKey,
          'isFree': uniqueKey == freeKey,
          'isPseudo': false,
        });
      }
    }

    if (cart.addGoldMembership && cart.items.isNotEmpty && user?.membershipActive != true) {
      flattenedItems.add({
        'id': 'gold_membership_pseudo',
        'name': 'EyeGlaze Membership',
        'sku': 'MEMBERSHIP-GOLD-1YR',
        'color': 'Gold',
        'qty': 1,
        'framePriceCalculated': 129.0,
        'lensPrice': 0.0,
        'isPseudo': true,
        'uniqueKey': 'gold_membership_pseudo',
      });
    }

    final showPromoMembership = user?.membershipActive != true;
    final totalListItems = flattenedItems.length + (showPromoMembership ? 1 : 0) + 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: false,
        title: const Text('My Cart', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
          : cart.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('🛒', style: TextStyle(fontSize: 60)),
                      const SizedBox(height: 16),
                      const Text('Your cart is empty', style: TextStyle(color: AppColors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('Add some frames to get started', style: TextStyle(color: AppColors.muted)),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: 200,
                        child: GoldButton(
                          label: 'SHOP NOW',
                          onPressed: () {
                            Navigator.pop(context);
                          },
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: totalListItems,
                        itemBuilder: (context, index) {
                          if (index < flattenedItems.length) {
                            final itemMap = flattenedItems[index];
                            final isPseudo = itemMap['isPseudo'] == true;
                            if (isPseudo) {
                              return _CartItemCard(
                                isPseudo: true,
                                isFree: false,
                                framePriceCalculated: 129.0,
                                onRemove: () => cart.setAddGoldMembership(false),
                              );
                            }
                            final CartItem item = itemMap['item'] as CartItem;
                            return _CartItemCard(
                              item: item,
                              isPseudo: false,
                              isFree: itemMap['isFree'] == true,
                              framePriceCalculated: itemMap['framePriceCalculated'] as double,
                              uniqueKey: itemMap['uniqueKey'] as String,
                              onRemove: () => _removeItem(item),
                              onRepeat: () => _repeatItem(item),
                            );
                          } else if (showPromoMembership && index == flattenedItems.length) {
                            return _buildMembershipPromoCard(context, cart);
                          } else {
                            return _buildCouponPromoCard(context, cart);
                          }
                        },
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: AppColors.card,
                        border: Border(top: BorderSide(color: AppColors.border)),
                      ),
                      child: Column(
                        children: [
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
                                  Text('₹${cart.itemsSubtotal.toInt()}', style: const TextStyle(color: AppColors.white, fontSize: 14)),
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
                          
                          if (cart.totalDiscount > 0) ...[
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
                                    Text('-₹${cart.totalDiscount.toInt()}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12)),
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
                                    if (cart.productDiscounts > 0)
                                      _buildDiscountDetailRow('Product Discount', '-₹${cart.productDiscounts.toInt()}'),
                                    if (cart.bogoDiscount > 0)
                                      _buildDiscountDetailRow('Buy 1 Get 1 Offer', '-₹${cart.bogoDiscount.toInt()}'),
                                    if (cart.couponDiscount > 0)
                                      _buildDiscountDetailRow('Coupon Discount (${cart.appliedCouponCode})', '-₹${cart.couponDiscount.toInt()}'),
                                  ],
                                ),
                              ),
                          ],
                          
                          if (cart.fittingFeeTotal > 0)
                            _PriceRow('Fitting Fee', '₹${cart.fittingFeeTotal.toInt()}'),
                          
                          _PriceRow('Shipping & Delivery', cart.delivery == 0 ? 'FREE' : '₹${cart.delivery.toInt()}'),

                          if (cart.membershipFee > 0)
                            _PriceRow('Gold Membership Fee', '₹${cart.membershipFee.toInt()}'),
                          
                          const Divider(color: AppColors.border),
                          Row(
                            children: [
                              const Text('Total Payable', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                              const Spacer(),
                              Text('₹${cart.totalPayable.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 20)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          GoldButton(
                            label: 'PROCEED TO CHECKOUT',
                            onPressed: () {
                              final auth = context.read<AuthService>();
                              if (!auth.isLoggedIn) {
                                Navigator.pushNamed(
                                  context,
                                  '/login',
                                  arguments: {'redirectTo': '/checkout'},
                                );
                              } else {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const CheckoutScreen()),
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildDiscountDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(label, style: const TextStyle(color: AppColors.success, fontSize: 11)),
          const Spacer(),
          Text(value, style: const TextStyle(color: AppColors.success, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildMembershipPromoCard(BuildContext context, CartProvider cart) {
    final addGoldMembership = cart.addGoldMembership;
    return GestureDetector(
      onTap: () => cart.setAddGoldMembership(!addGoldMembership),
      behavior: HitTestBehavior.opaque,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF16120C),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: addGoldMembership ? AppColors.gold : AppColors.gold.withValues(alpha: 0.3),
            width: addGoldMembership ? 1.5 : 1.0,
          ),
          boxShadow: addGoldMembership
              ? [BoxShadow(color: AppColors.gold.withValues(alpha: 0.15), blurRadius: 12, spreadRadius: 2)]
              : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                    ),
                    child: const Text(
                      'GOLD MEMBER BENEFITS',
                      style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    addGoldMembership 
                        ? 'EyeGlaze Membership Added'
                        : 'Add EyeGlaze Membership and Avail Buy 1 Get 1 Free + 10% Cashback',
                    style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold, height: 1.3),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          addGoldMembership
                              ? 'Add 2nd pair for FREE'
                              : 'Get member benefits instantly on this order · ₹129 / year',
                          style: const TextStyle(color: AppColors.muted, fontSize: 9),
                        ),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => _showMembershipDetailsDialog(context),
                        child: const Text(
                          'View Details',
                          style: TextStyle(color: AppColors.gold, fontSize: 9, fontWeight: FontWeight.bold, decoration: TextDecoration.underline),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: () => cart.setAddGoldMembership(!addGoldMembership),
              style: ElevatedButton.styleFrom(
                backgroundColor: addGoldMembership ? AppColors.success : AppColors.gold,
                foregroundColor: addGoldMembership ? Colors.white : Colors.black,
                shape: const CircleBorder(),
                padding: const EdgeInsets.all(8),
                minimumSize: Size.zero,
              ),
              child: Icon(
                addGoldMembership ? Icons.check : Icons.arrow_forward,
                size: 16,
                color: addGoldMembership ? Colors.white : Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCouponPromoCard(BuildContext context, CartProvider cart) {
    final appliedCoupon = cart.appliedCouponCode;
    final discount = cart.couponDiscount;
    final error = cart.couponError;
    final success = cart.couponSuccessMessage;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'APPLY COUPON',
            style: TextStyle(color: AppColors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () => _openCouponSelectionSheet(context, cart),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0B0B0C),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: appliedCoupon != null ? AppColors.success.withValues(alpha: 0.5) : AppColors.border,
                ),
              ),
              child: Row(
                children: [
                  const Text('🎫', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          appliedCoupon != null ? 'Coupon: $appliedCoupon' : 'Apply Coupon',
                          style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          appliedCoupon != null ? 'Saved ₹${discount.toInt()}!' : 'Check available offers',
                          style: const TextStyle(color: AppColors.muted, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  if (appliedCoupon != null)
                    TextButton(
                      onPressed: () => cart.removeCouponCode(),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'REMOVE',
                        style: TextStyle(color: AppColors.error, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    )
                  else
                    const Icon(Icons.arrow_forward_ios, color: AppColors.muted, size: 12),
                ],
              ),
            ),
          ),
          if (error != null) ...[
            const SizedBox(height: 6),
            Text(error, style: const TextStyle(color: AppColors.error, fontSize: 10)),
          ],
          if (success != null) ...[
            const SizedBox(height: 6),
            Text(success, style: const TextStyle(color: AppColors.success, fontSize: 10)),
          ],
        ],
      ),
    );
  }

  void _showMembershipDetailsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.border)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              ),
              child: const Text('GOLD MEMBER', style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 8),
            const Text('Benefits', style: TextStyle(color: AppColors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildBenefitRow('1', 'Buy 1 Get 1 Free', 'Buy any frame with lens and get the second frame + lens of equal or lesser value absolutely free. Usable once per calendar month.'),
            const SizedBox(height: 12),
            _buildBenefitRow('2', '10% Cashback', 'Get 10% cashback credited to your EyeGlaze wallet on every single purchase.'),
            const SizedBox(height: 12),
            _buildBenefitRow('3', 'Free Shipping & Fitting', 'No delivery charges, no fitting fees. Standard shipping is always on us.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CLOSE', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitRow(String num, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 18, height: 18,
          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.1), border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)), shape: BoxShape.circle),
          alignment: Alignment.center,
          child: Text(num, style: const TextStyle(color: AppColors.gold, fontSize: 9, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text(desc, style: const TextStyle(color: AppColors.muted, fontSize: 10, height: 1.3)),
            ],
          ),
        ),
      ],
    );
  }

  void _openCouponSelectionSheet(BuildContext context, CartProvider cart) {
    final api = ApiService(context.read<AuthService>());
    final couponCtrl = TextEditingController();
    bool loadingCoupons = true;
    List<dynamic> activeCoupons = [];
    String sheetError = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            if (loadingCoupons) {
              api.getActiveCoupons().then((res) {
                setSheetState(() {
                  activeCoupons = (res['coupons'] ?? res['data'] ?? []) as List;
                  loadingCoupons = false;
                });
              }).catchError((_) {
                setSheetState(() {
                  loadingCoupons = false;
                });
              });
            }

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
                          controller: couponCtrl,
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
                        onPressed: () async {
                          final code = couponCtrl.text.trim();
                          if (code.isEmpty) return;
                          setSheetState(() => sheetError = '');
                          await cart.validateCouponCode(code);
                          if (cart.couponError != null) {
                            setSheetState(() => sheetError = cart.couponError!);
                          } else {
                            if (context.mounted) Navigator.pop(context);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          minimumSize: Size.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('APPLY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                  if (sheetError.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(sheetError, style: const TextStyle(color: AppColors.error, fontSize: 11)),
                  ],
                  const SizedBox(height: 16),
                  if (loadingCoupons)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator(color: AppColors.gold)),
                    )
                  else if (activeCoupons.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: Text('No active coupons available right now', style: TextStyle(color: AppColors.muted, fontSize: 12))),
                    )
                  else
                    ConstrainedBox(
                      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.4),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: activeCoupons.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final coupon = activeCoupons[index];
                          final code = (coupon['code'] ?? '').toString();
                          final description = (coupon['description'] ?? '').toString();
                          final badge = coupon['badge']?.toString();
                          final minOrderValue = coupon['minOrderValue'];
                          final maxDiscount = coupon['maxDiscount'];
                          final isApplied = cart.appliedCouponCode == code;

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
                                          if (isApplied) {
                                            cart.removeCouponCode();
                                            Navigator.pop(context);
                                          } else {
                                            setSheetState(() => sheetError = '');
                                            await cart.validateCouponCode(code);
                                            if (cart.couponError != null) {
                                              setSheetState(() => sheetError = cart.couponError!);
                                            } else {
                                              Navigator.pop(context);
                                            }
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
}

class _CartItemCard extends StatelessWidget {
  final CartItem? item;
  final bool isPseudo;
  final bool isFree;
  final double framePriceCalculated;
  final VoidCallback onRemove;
  final VoidCallback? onRepeat;
  final String? uniqueKey;

  const _CartItemCard({
    this.item,
    required this.isPseudo,
    required this.isFree,
    required this.framePriceCalculated,
    required this.onRemove,
    this.onRepeat,
    this.uniqueKey,
  });

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

  @override
  Widget build(BuildContext context) {
    if (isPseudo) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: const Color(0xFF1E1911),
                border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              ),
              child: const Center(
                child: Text('🏆', style: TextStyle(fontSize: 32)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'EyeGlaze Gold Membership',
                    style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Buy 1 Get 1 Free On Over 5000+ Items, Applicable Everywhere',
                    style: TextStyle(color: AppColors.muted, fontSize: 10, height: 1.3),
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: onRemove,
                    child: const Text(
                      'Remove',
                      style: TextStyle(
                        color: AppColors.error,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: const [
                Text(
                  '₹129',
                  style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 15),
                ),
                SizedBox(height: 4),
                Text(
                  '₹600',
                  style: TextStyle(color: AppColors.muted, fontSize: 11, decoration: TextDecoration.lineThrough),
                ),
              ],
            ),
          ],
        ),
      );
    }

    final cartItem = item!;
    final lensText = _getLensText(cartItem);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      border: Border.all(color: AppColors.border),
                    ),
                    child: cartItem.product != null &&
                            ((cartItem.product!.thumbnail != null && cartItem.product!.thumbnail!.isNotEmpty) ||
                             cartItem.product!.images.isNotEmpty)
                        ? CachedNetworkImage(
                            imageUrl: AppConfig.resolveImageUrl(
                              (cartItem.product!.thumbnail != null && cartItem.product!.thumbnail!.isNotEmpty)
                                  ? cartItem.product!.thumbnail!
                                  : cartItem.product!.images.first,
                            ),
                            fit: BoxFit.contain,
                            placeholder: (context, url) => const Center(
                              child: SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.5),
                              ),
                            ),
                            errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 24),
                          )
                        : const Center(
                            child: Text('👓', style: TextStyle(fontSize: 24)),
                          ),
                  ),
                  if (isFree)
                    Positioned(
                      top: 0, left: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        color: AppColors.success,
                        child: const Text(
                          'FREE',
                          style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cartItem.product?.name ?? 'Frame',
                      style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${cartItem.product?.sku ?? ''} · ${cartItem.selectedColor ?? ''}',
                      style: const TextStyle(color: AppColors.muted, fontSize: 11),
                    ),
                    if (lensText.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Lens: $lensText',
                        style: const TextStyle(color: AppColors.muted, fontSize: 11),
                      ),
                    ],
                    if (cartItem.lensConfig != null) ...[
                      if (cartItem.lensConfig!.name != null && cartItem.lensConfig!.name!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Text(
                              'Label: ',
                              style: TextStyle(color: AppColors.muted, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                              ),
                              child: Text(
                                cartItem.lensConfig!.name!.toUpperCase(),
                                style: const TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.w900),
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (cartItem.lensConfig!.uploadLater == true) ...[
                        const SizedBox(height: 4),
                        Text(
                          cartItem.lensConfig!.uploadedFileUrl != null ? 'Prescription: 📄 Document Uploaded' : 'Prescription: ⏳ Upload Later',
                          style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ] else if (cartItem.lensConfig!.re != null || cartItem.lensConfig!.le != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Power: '
                          'RE: ${cartItem.lensConfig!.re?.sph != null ? (cartItem.lensConfig!.re!.sph! > 0 ? '+' : '') + cartItem.lensConfig!.re!.sph!.toStringAsFixed(2) : '0.00'}'
                          ' · '
                          'LE: ${cartItem.lensConfig!.le?.sph != null ? (cartItem.lensConfig!.le!.sph! > 0 ? '+' : '') + cartItem.lensConfig!.le!.sph!.toStringAsFixed(2) : '0.00'}',
                          style: const TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (onRepeat != null) ...[
                          GestureDetector(
                            onTap: onRepeat,
                            child: const Text(
                              'Repeat',
                              style: TextStyle(
                                color: AppColors.gold,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                        ],
                        GestureDetector(
                          onTap: onRemove,
                          child: const Text(
                            'Remove',
                            style: TextStyle(
                              color: AppColors.error,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    isFree ? 'Free' : '₹${(framePriceCalculated + (cartItem.lensPrice ?? 0.0)).toInt()}',
                    style: TextStyle(
                      color: isFree ? AppColors.success : AppColors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Frame: ₹${framePriceCalculated.toInt()}',
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: 11,
                      decoration: isFree ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  if (cartItem.lensPrice != null && cartItem.lensPrice! > 0)
                    Text(
                      'Lens: ₹${cartItem.lensPrice!.toInt()}',
                      style: TextStyle(
                        color: AppColors.muted,
                        fontSize: 11,
                        decoration: isFree ? TextDecoration.lineThrough : null,
                      ),
                    ),
                ],
              ),
            ],
          ),
          if (isFree) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                border: Border.all(color: AppColors.success.withValues(alpha: 0.2)),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: const [
                  Icon(Icons.check_circle_outline, color: AppColors.success, size: 12),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'This Product is Free with EyeGlaze Membership!',
                      style: TextStyle(color: AppColors.success, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  const _PriceRow(this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          children: [
            Text(label, style: AppTextStyles.muted),
            const Spacer(),
            Text(value, style: const TextStyle(color: AppColors.white, fontSize: 14)),
          ],
        ),
      );
}