import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/order.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/socket_service.dart';
import 'order_details_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
    
    // Connect socket listener
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        try {
          final socketService = context.read<SocketService>();
          socketService.socket?.on('order_changed', _onOrderChanged);
        } catch (_) {}
      }
    });
  }

  @override
  void dispose() {
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('order_changed', _onOrderChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onOrderChanged(dynamic data) {
    if (mounted) {
      _loadOrders();
    }
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final list = await api.getOrders();
      setState(() => _orders = list.map((o) => Order.fromJson(o)).toList());
    } catch (e) {
      setState(() => _orders = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered': return AppColors.success;
      case 'shipped': return Colors.blue;
      case 'processing':
      case 'confirmed': return Colors.orange;
      case 'cancelled': return AppColors.error;
      default: return AppColors.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        scrolledUnderElevation: 0,
        title: const Text('My Orders', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        automaticallyImplyLeading: false,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
          : _orders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.shopping_bag_outlined, color: AppColors.muted, size: 60),
                      SizedBox(height: 12),
                      Text('No orders yet', style: AppTextStyles.heading3),
                      SizedBox(height: 8),
                      Text('Your order history will appear here', style: AppTextStyles.muted),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.gold,
                  onRefresh: _loadOrders,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (_, i) {
                      final order = _orders[i];
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OrderDetailsScreen(order: order),
                            ),
                          );
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(order.orderNumber, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: _statusColor(order.status).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: _statusColor(order.status).withValues(alpha: 0.4)),
                                    ),
                                    child: Text(order.status.toUpperCase(), style: TextStyle(color: _statusColor(order.status), fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('${order.items.length} item(s)', style: AppTextStyles.muted),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Text('Total: ₹${order.total.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 15)),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(border: Border.all(color: AppColors.gold), borderRadius: BorderRadius.circular(6)),
                                    child: const Text('TRACK', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 11)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
