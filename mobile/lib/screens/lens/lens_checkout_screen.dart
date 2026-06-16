import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/lens_step_bar.dart';
import '../../widgets/lens_wizard_state.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/trust_strip.dart';

class LensCheckoutScreen extends StatefulWidget {
  const LensCheckoutScreen({super.key});

  @override
  State<LensCheckoutScreen> createState() => _LensCheckoutScreenState();
}

class _LensCheckoutScreenState extends State<LensCheckoutScreen> {
  final _couponCtrl = TextEditingController();
  double _discount = 0;
  bool _applyingCoupon = false;
  bool _placingOrder = false;

  Future<void> _applyCoupon(LensWizardState wizard) async {
    final code = _couponCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() => _applyingCoupon = true);
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final framePrice = wizard.product?.sellingPrice ?? 1.0;
      final lensPrice = wizard.lensPrice ?? 999.0;
      const fittingCharge = 199.0;
      const deliveryCharge = 99.0;
      final orderTotal = framePrice + lensPrice + fittingCharge + deliveryCharge;
      final result = await api.validateCoupon(code, orderTotal);
      if (result['valid'] == true || result['discount'] != null) {
        final saved = (result['discount'] ?? result['amountSaved'] ?? 0).toDouble();
        setState(() => _discount = saved);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Coupon applied! You saved ₹${saved.toInt()}'),
            backgroundColor: AppColors.success,
          ));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(result['message'] ?? 'Invalid coupon code'),
            backgroundColor: AppColors.error,
          ));
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to apply coupon'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _applyingCoupon = false);
    }
  }

  Future<void> _proceedToPayment(LensWizardState wizard) async {
    setState(() => _placingOrder = true);
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final p = wizard.product;
      if (p == null) return;

      // Build lens config payload matching cart API
      final lensConfig = {
        'lensType': wizard.lensType,
        'lensSubType': wizard.lensSubType,
        'lensQuality': wizard.lensQuality,
        'lensPrice': wizard.lensPrice,
        'power': wizard.rightEye != null
            ? {
                'RE': {'sph': wizard.rightEye!.sph, 'cyl': wizard.rightEye!.cyl, 'axis': wizard.rightEye!.axis},
                'LE': {'sph': wizard.leftEye!.sph, 'cyl': wizard.leftEye!.cyl, 'axis': wizard.leftEye!.axis},
                'pd': wizard.pd,
              }
            : null,
      };

      await api.addToCart({
        'productId': p.id,
        'qty': 1,
        'color': wizard.selectedColor,
        'lens': lensConfig,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Added to cart — proceeding to payment...'), backgroundColor: AppColors.gold),
        );
        // TODO: Navigate to address/payment screen
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to proceed: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _placingOrder = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final wizard = context.watch<LensWizardState>();
    final product = wizard.product;
    final framePrice = wizard.product?.sellingPrice ?? 1.0;
    final lensPrice = wizard.lensPrice ?? 999.0;
    const fittingCharge = 199.0;
    const deliveryCharge = 99.0;
    final subtotal = framePrice + lensPrice + fittingCharge + deliveryCharge - _discount;
    final savings = 201.0 + _discount;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Checkout', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const LensStepBar(currentStep: 4),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text('Review your order details', style: AppTextStyles.muted),
            ),
            // Order summary card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('ORDER SUMMARY', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
                    const Divider(color: AppColors.border),
                    // Product line
                    Row(
                      children: [
                        Container(
                          width: 52, height: 52,
                          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.visibility_outlined, color: AppColors.muted, size: 24),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${product?.sku} ${product?.name}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                              Text('${wizard.selectedColor} • Size: ${wizard.sizeString} • Qty 1', style: AppTextStyles.muted),
                            ],
                          ),
                        ),
                        const Text('Edit', style: TextStyle(color: AppColors.gold, fontSize: 12, decoration: TextDecoration.underline)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _SummaryRow('Lens Type', _formatLensType(wizard.lensType)),
                    _SummaryRow('Power', 'R: ${wizard.rightEye?.sph ?? '-'}/${wizard.rightEye?.cyl ?? '-'}/${wizard.rightEye?.axis ?? '-'}, L: ${wizard.leftEye?.sph ?? '-'}/${wizard.leftEye?.cyl ?? '-'}/${wizard.leftEye?.axis ?? '-'}'),
                    _SummaryRow('Lens Quality', wizard.lensQuality ?? 'HMC + Blue Cut'),
                    const Divider(color: AppColors.border),
                    _PriceRow('Frame Price', '₹${framePrice.toInt()}'),
                    _PriceRow('Lenses (${wizard.lensQuality ?? 'HMC + Blue Cut'})', '₹${lensPrice.toInt()}'),
                    _PriceRow('Fitting', '₹${fittingCharge.toInt()}'),
                    _PriceRow('Delivery Charge', '₹${deliveryCharge.toInt()}'),
                    if (_discount > 0) _PriceRow('Coupon Discount', '-₹${_discount.toInt()}', valueColor: AppColors.success),
                    const Divider(color: AppColors.border),
                    // Coupon input
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _couponCtrl,
                            style: const TextStyle(color: AppColors.white, fontSize: 13),
                            decoration: const InputDecoration(
                              hintText: 'Apply Coupon Code',
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _applyingCoupon ? null : () => _applyCoupon(wizard),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(8)),
                            child: _applyingCoupon
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Membership upsell
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.workspace_premium, color: AppColors.gold, size: 28),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('EYEGLAZE MEMBERSHIP', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5)),
                          SizedBox(height: 3),
                          Text('Join & get exclusive benefits: Free delivery, extended warranty & more!', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                          SizedBox(height: 4),
                          Text('₹99/year', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(8)),
                      child: const Text('Join Now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Total amount
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Text('Total Amount:', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                  const Spacer(),
                  Text('₹${subtotal.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 22)),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('You will save ₹${savings.toInt()} on this order', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w600, fontSize: 13)),
            ),
            const TrustStrip(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: GoldButton(
                label: _placingOrder ? 'PROCESSING...' : 'PROCEED TO PAYMENT →',
                onPressed: _placingOrder ? null : () => _proceedToPayment(wizard),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  String _formatLensType(String? type) {
    switch (type) {
      case 'single_vision': return 'Single Vision';
      case 'progressive': return 'Progressive';
      case 'zero_power': return 'Zero Power (Plano)';
      case 'bluecut': return 'Blue Cut';
      case 'photochromic': return 'Photochromic';
      default: return type ?? '-';
    }
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow(this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 5),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 110, child: Text('$label:', style: AppTextStyles.muted)),
        Expanded(child: Text(value, style: const TextStyle(color: AppColors.white, fontSize: 13))),
      ],
    ),
  );
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _PriceRow(this.label, this.value, {this.valueColor});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(
      children: [
        Text(label, style: AppTextStyles.muted),
        const Spacer(),
        Text(value, style: TextStyle(color: valueColor ?? AppColors.white, fontWeight: FontWeight.w600, fontSize: 14)),
      ],
    ),
  );
}
