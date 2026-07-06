import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';
import '../../core/app_config.dart';
import '../../models/order.dart';

class OrderDetailsScreen extends StatelessWidget {
  final Order order;

  const OrderDetailsScreen({super.key, required this.order});

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return AppColors.success;
      case 'shipped':
        return Colors.blue;
      case 'processing':
      case 'confirmed':
        return Colors.orange;
      case 'cancelled':
        return AppColors.error;
      default:
        return AppColors.muted;
    }
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return DateFormat('dd MMM yyyy, hh:mm a').format(date);
    } catch (_) {
      return isoString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        scrolledUnderElevation: 0,
        title: const Text('Order Details', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Order Info Header Card
            Container(
              padding: const EdgeInsets.all(16),
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        order.orderNumber,
                        style: const TextStyle(
                          color: AppColors.white,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: _statusColor(order.status).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: _statusColor(order.status).withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          order.status.toUpperCase(),
                          style: TextStyle(
                            color: _statusColor(order.status),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Ordered on ${_formatDate(order.createdAt)}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                  if (order.estimatedDelivery != null && order.estimatedDelivery!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.local_shipping_outlined, color: AppColors.gold, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'Estimated Delivery: ${_formatDate(order.estimatedDelivery!)}',
                          style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Shipping Address Card
            if (order.address != null) ...[
              const Text('SHIPPING ADDRESS', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order.address!.fullName, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text('+91 ${order.address!.mobile}', style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                    const SizedBox(height: 8),
                    Text(
                      '${order.address!.line1}${order.address!.line2 != null && order.address!.line2!.isNotEmpty ? ', ' + order.address!.line2! : ''}\n'
                      '${order.address!.city}, ${order.address!.state} - ${order.address!.pincode}',
                      style: const TextStyle(color: AppColors.muted, fontSize: 11, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 3. Items Ordered Card
            const Text('ITEMS ORDERED', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: order.items.length,
                separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 24),
                itemBuilder: (context, i) {
                  final item = order.items[i];
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Product Image
                      Container(
                        width: 50, height: 50,
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: item.productImage != null && item.productImage!.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: AppConfig.resolveImageUrl(item.productImage!),
                                  fit: BoxFit.contain,
                                  placeholder: (context, url) => const Center(
                                    child: SizedBox(
                                      width: 16, height: 16,
                                      child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.5),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 20),
                                )
                              : const Icon(Icons.visibility_outlined, color: AppColors.muted, size: 24),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.productName ?? 'Frame Product',
                              style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Color: ${item.color ?? 'Default'} • Qty: ${item.qty}',
                              style: const TextStyle(color: AppColors.muted, fontSize: 11),
                            ),
                            if (item.lensType != null && item.lensType!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Lens: ${item.lensType} (${item.lensQuality ?? ''})',
                                style: const TextStyle(color: AppColors.muted, fontSize: 10),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '₹${((item.framePrice + (item.lensPrice ?? 0) + (item.fittingCharge ?? 0)) * item.qty).toInt()}',
                        style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontSize: 13),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 16),

            // 4. Payment & Tracking Details Card
            if ((order.paymentMethod != null && order.paymentMethod!.isNotEmpty) || (order.trackingNumber != null && order.trackingNumber!.isNotEmpty)) ...[
              const Text('PAYMENT & SHIPPING', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (order.paymentMethod != null && order.paymentMethod!.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Payment Method', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          Text(order.paymentMethod!.toUpperCase(), style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Payment Status', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          Text(
                            order.paymentStatus.toUpperCase(),
                            style: TextStyle(
                              color: order.paymentStatus.toLowerCase() == 'paid' ? AppColors.success : AppColors.muted,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (order.trackingNumber != null && order.trackingNumber!.isNotEmpty) ...[
                      if (order.paymentMethod != null && order.paymentMethod!.isNotEmpty) const Divider(color: AppColors.border, height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Courier Partner', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          Text(order.courierPartner ?? 'Standard Courier', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Tracking Number', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          Text(
                            order.trackingNumber!,
                            style: const TextStyle(
                              color: AppColors.gold,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 5. Price Breakdown Summary Card
            const Text('ORDER SUMMARY', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _SummaryRow('Total Item Price', '₹${order.subtotal.toInt()}'),
                  if (order.fittingCharge > 0)
                    _SummaryRow('Fitting Fee', '₹${order.fittingCharge.toInt()}'),
                  _SummaryRow('Shipping & Delivery', '₹${order.deliveryCharge.toInt()}'),
                  if (order.discount > 0)
                    _SummaryRow('Discount Applied', '-₹${order.discount.toInt()}', isDiscount: true),
                  if (order.walletUsed > 0)
                    _SummaryRow('Wallet Used', '-₹${order.walletUsed.toInt()}', isDiscount: true),
                  const Divider(color: AppColors.border, height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Amount', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                      Text('₹${order.total.toInt()}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 18)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDiscount;

  const _SummaryRow(this.label, this.value, {this.isDiscount = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          Text(
            value,
            style: TextStyle(
              color: isDiscount ? AppColors.success : AppColors.white,
              fontWeight: isDiscount ? FontWeight.bold : FontWeight.normal,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
