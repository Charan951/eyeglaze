import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/cart_item.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/gold_button.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  List<CartItem> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  Future<void> _loadCart() async {
    setState(() => _loading = true);
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final data = await api.getCart();
      final items = (data['items'] ?? []) as List;
      setState(() => _items = items.map((i) => CartItem.fromJson(i)).toList());
    } catch (e) {
      setState(() => _items = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _removeItem(String id) async {
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      await api.removeFromCart(id);
      _loadCart();
    } catch (e) {
      // ignore
    }
  }

  double get _subtotal => _items.fold(0, (s, i) => s + i.totalPrice);
  double get _delivery => _items.isNotEmpty ? 99 : 0;
  double get _total => _subtotal + _delivery;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: Text('My Cart (${_items.length})', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
          : _items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_bag_outlined, color: AppColors.muted, size: 60),
                      const SizedBox(height: 12),
                      const Text('Your cart is empty', style: AppTextStyles.heading3),
                      const SizedBox(height: 8),
                      const Text('Add some frames to get started!', style: AppTextStyles.muted),
                      const SizedBox(height: 20),
                      GoldButton(label: 'BROWSE PRODUCTS', onPressed: () => Navigator.pop(context), width: 200),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        itemBuilder: (_, i) => _CartItemCard(
                          item: _items[i],
                          onRemove: () => _removeItem(_items[i].id),
                        ),
                      ),
                    ),
                    // Order summary
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: AppColors.card,
                        border: Border(top: BorderSide(color: AppColors.border)),
                      ),
                      child: Column(
                        children: [
                          _PriceRow('Subtotal', '₹${_subtotal.toInt()}'),
                          _PriceRow('Delivery Charge', '₹${_delivery.toInt()}'),
                          const Divider(color: AppColors.border),
                          Row(
                            children: [
                              const Text('Total', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                              const Spacer(),
                              Text('₹${_total.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          GoldButton(
                            label: 'PROCEED TO CHECKOUT',
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const CheckoutScreen()),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final VoidCallback onRemove;

  const _CartItemCard({required this.item, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.visibility_outlined, color: AppColors.muted, size: 30),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.product?.name ?? 'Frame', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w700)),
                if (item.selectedColor != null) Text('Color: ${item.selectedColor}', style: AppTextStyles.muted),
                if (item.lensType != null) Text('Lens: ${item.lensType}', style: AppTextStyles.muted),
                const SizedBox(height: 6),
                Text('₹${item.totalPrice.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 16)),
              ],
            ),
          ),
          IconButton(icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20), onPressed: onRemove),
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
