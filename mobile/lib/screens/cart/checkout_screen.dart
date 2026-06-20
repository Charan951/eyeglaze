import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/trust_strip.dart';
import '../../models/cart_item.dart';
import '../orders/orders_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  // Loading & submissions state
  bool _loading = true;
  bool _submitting = false;
  List<CartItem> _items = [];

  // Form controllers
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _line1Ctrl = TextEditingController();
  final _line2Ctrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();

  // Payment Selection
  String _paymentMethod = 'cod'; // cod, card, upi

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
    _line1Ctrl.dispose();
    _line2Ctrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCartAndAddresses() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      
      // Load cart items
      final cartData = await api.getCart();
      final cartItems = (cartData['items'] ?? []) as List;
      _items = cartItems.map((i) => CartItem.fromJson(i)).toList();

      // Pre-fill default address from user profile
      final user = auth.currentUser;
      if (user != null && user.addresses.isNotEmpty) {
        // Find default or select the first address
        dynamic defaultAddr;
        for (final addr in user.addresses) {
          if (addr.isDefault == true) {
            defaultAddr = addr;
            break;
          }
        }
        defaultAddr ??= user.addresses.first;
        _fillAddress(defaultAddr);
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
    _line1Ctrl.text = addr.line1 ?? '';
    _line2Ctrl.text = addr.line2 ?? '';
    _cityCtrl.text = addr.city ?? '';
    _stateCtrl.text = addr.state ?? '';
    _pincodeCtrl.text = addr.pincode ?? '';
  }

  double get _subtotal => _items.fold(0, (s, i) => s + i.totalPrice);
  double get _delivery => _items.isNotEmpty ? 99 : 0;
  double get _total => _subtotal + _delivery;

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
      final api = ApiService(auth);

      final payload = {
        'deliveryAddress': {
          'fullName': _nameCtrl.text.trim(),
          'mobile': _phoneCtrl.text.trim(),
          'line1': _line1Ctrl.text.trim(),
          'line2': _line2Ctrl.text.trim(),
          'city': _cityCtrl.text.trim(),
          'state': _stateCtrl.text.trim(),
          'pincode': _pincodeCtrl.text.trim(),
        },
        'paymentMethod': _paymentMethod,
        'paymentStatus': 'paid',
      };

      final response = await api.createOrder(payload);
      if (response['orderId'] != null) {
        final estDelivery = response['estimatedDelivery'] != null
            ? DateTime.parse(response['estimatedDelivery'])
            : DateTime.now().add(const Duration(days: 5));
        
        final formatter = DateFormat('EEEE, d MMMM yyyy');

        setState(() {
          _orderSuccess = true;
          _successOrderId = response['orderId'];
          _successTotal = (response['total'] ?? _total).toDouble();
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
                    itemCount: user.addresses.length,
                    itemBuilder: (context, i) {
                      final addr = user.addresses[i];
                      return GestureDetector(
                        onTap: () => setState(() => _fillAddress(addr)),
                        child: Container(
                          width: 170,
                          margin: const EdgeInsets.only(right: 10),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
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

              // Address fields form
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
                validator: (val) => val == null || val.length != 10 ? 'Enter a valid 10-digit number' : null,
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

              // 2. Payment Method
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
                      activeColor: AppColors.gold,
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                    ),
                    const Divider(color: AppColors.border, height: 1),
                    RadioListTile<String>(
                      title: const Text('Credit / Debit Card', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: const Text('Secure payment via Visa, Mastercard, RuPay', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                      value: 'card',
                      groupValue: _paymentMethod,
                      activeColor: AppColors.gold,
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                    ),
                    const Divider(color: AppColors.border, height: 1),
                    RadioListTile<String>(
                      title: const Text('UPI / NetBanking', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: const Text('Instant transfer via GPay, PhonePe, Paytm', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                      value: 'upi',
                      groupValue: _paymentMethod,
                      activeColor: AppColors.gold,
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

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
                      itemCount: _items.length,
                      itemBuilder: (context, i) {
                        final item = _items[i];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(6)),
                                child: const Icon(Icons.visibility_outlined, color: AppColors.muted, size: 20),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.product?.name ?? 'Frame', style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    Text('${item.selectedColor ?? ''} • Qty ${item.qty}', style: const TextStyle(color: AppColors.muted, fontSize: 10)),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text('₹${item.totalPrice.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        );
                      },
                    ),
                    const Divider(color: AppColors.border),
                    const SizedBox(height: 6),
                    _PriceSummaryRow(label: 'Subtotal', value: '₹${_subtotal.toInt()}'),
                    _PriceSummaryRow(label: 'Shipping & Delivery', value: '₹${_delivery.toInt()}'),
                    const Divider(color: AppColors.border),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Text('Total Amount', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                        const Spacer(),
                        Text('₹${_total.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 18)),
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
  const _PriceSummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          const Spacer(),
          Text(value, style: const TextStyle(color: AppColors.white, fontSize: 12)),
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
