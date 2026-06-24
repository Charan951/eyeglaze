import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme.dart';
import '../../widgets/responsive_container.dart';

class OfferData {
  final String code;
  final String title;
  final String description;
  final String expires;
  final String badge;

  const OfferData({
    required this.code,
    required this.title,
    required this.description,
    required this.expires,
    required this.badge,
  });
}

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});

  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  String? _copiedCode;

  static const List<OfferData> _offers = [
    OfferData(
      code: 'EYEGOLD50',
      title: '50% OFF FRAMES',
      description: 'Get up to 50% discount on select luxury aviators and prescription frames. Starting at just ₹1!',
      expires: 'Valid until June 30, 2026',
      badge: 'Bestseller',
    ),
    OfferData(
      code: 'FREECOAT',
      title: 'FREE ANTI-GLARE COATING',
      description: 'Upgrade your prescription glasses with anti-reflective and water-repellent coatings for free. Saving ₹699.',
      expires: 'Limited Time Offer',
      badge: 'Premium',
    ),
    OfferData(
      code: 'DELIVERYFREE',
      title: 'FREE SHIPPING',
      description: 'Enjoy free premium shipping with secure packaging on all order values across India.',
      expires: 'Always Active',
      badge: 'Shipping',
    ),
    OfferData(
      code: 'WELCOME10',
      title: '₹200 NEW USER DISCOUNT',
      description: 'Sign up and place your first order to get flat ₹200 off. Valid on minimum cart value of ₹999.',
      expires: 'First Order Only',
      badge: 'Welcome',
    ),
  ];

  void _copyToClipboard(String code) {
    Clipboard.setData(ClipboardData(text: code));
    setState(() => _copiedCode = code);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Coupon code "$code" copied to clipboard!'),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copiedCode = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'OFFERS & DEALS',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2,
          ),
        ),
      ),
      body: ResponsiveContainer(
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _offers.length + 1,
          itemBuilder: (context, idx) {
            if (idx == 0) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(width: 8, height: 2, color: AppColors.gold),
                        const SizedBox(width: 8),
                        const Text(
                          'PROMOTIONS',
                          style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1.5),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Save big on luxury frames and premium custom lenses. Copy any coupon code below and apply it at checkout to redeem.',
                      style: TextStyle(color: AppColors.white, fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              );
            }

            final offer = _offers[idx - 1];
            final isCopied = _copiedCode == offer.code;

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Stack(
                children: [
                  // Ticket circle cuts
                  Positioned(
                    left: -8,
                    top: 80,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: AppColors.background,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Positioned(
                    right: -8,
                    top: 80,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: AppColors.background,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  
                  Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Text(
                                offer.badge.toUpperCase(),
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 8.5,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            Text(
                              offer.expires,
                              style: const TextStyle(
                                color: AppColors.muted,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          offer.title,
                          style: const TextStyle(
                            color: AppColors.gold,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          offer.description,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 20),
                        
                        // Copy Box
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'COUPON CODE',
                                    style: TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 8,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    offer.code,
                                    style: const TextStyle(
                                      color: AppColors.white,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'monospace',
                                      fontSize: 14,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                              const Spacer(),
                              ElevatedButton(
                                onPressed: () => _copyToClipboard(offer.code),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isCopied ? AppColors.success : AppColors.gold,
                                  foregroundColor: isCopied ? AppColors.white : Colors.black,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                ),
                                child: Text(
                                  isCopied ? '✓ COPIED' : 'COPY',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
