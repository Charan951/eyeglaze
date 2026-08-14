import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/app_config.dart';
import '../../core/theme.dart';
import '../../models/user.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/membership_price_provider.dart';

class MembershipScreen extends StatefulWidget {
  const MembershipScreen({super.key});

  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  static const _pageBg = Color(0xFF070708);
  static const _gold = Color(0xFFD4A04D);

  bool _loading = false;

  Future<void> _activateMembership() async {
    final authService = context.read<AuthService>();
    final currentUser = authService.currentUser;
    final membershipPrice = context.read<MembershipPriceProvider>().priceInt;

    if (currentUser == null || currentUser.walletBalance < membershipPrice) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Insufficient wallet balance. Please add ₹$membershipPrice to your wallet.',
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.card,
        title: const Text(
          'Activate Gold Membership',
          style: TextStyle(color: AppColors.white),
        ),
        content: Text(
          'Activate Gold Membership for ₹$membershipPrice/year?\n\nThis will be deducted from your wallet balance.',
          style: const TextStyle(color: AppColors.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.muted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Activate',
              style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _loading = true);
      try {
        final api = ApiService(authService);
        final response = await api.activateMembership();
        if (response['success'] == true && response['user'] != null) {
          final user = User.fromJson(response['user']);
          authService.setUser(user);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('🎉 Gold Membership activated!'),
                backgroundColor: AppColors.success,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        } else {
          throw response['error'] ?? 'Failed to activate membership';
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
          );
        }
      } finally {
        if (mounted) setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().currentUser;
    final isGoldMember = user?.membershipActive ?? false;
    final price = context.watch<MembershipPriceProvider>().priceInt;

    return Scaffold(
      backgroundColor: _pageBg,
      appBar: AppBar(
        backgroundColor: _pageBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF9CA3AF), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          children: [
            Text(
              'EYEGLAZE',
              style: TextStyle(
                color: _gold,
                fontWeight: FontWeight.w900,
                fontSize: 14,
                letterSpacing: 3.2,
                height: 1,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'GOLD MEMBERSHIP',
              style: TextStyle(
                color: Color(0xE6D4A04D),
                fontWeight: FontWeight.w900,
                fontSize: 8,
                letterSpacing: 2.4,
                height: 1,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  border: Border.all(color: _gold),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'BEST VALUE',
                  style: TextStyle(
                    color: _gold,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ),
          ),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: Color(0xFF1C1C1E)),
        ),
      ),
      body: isGoldMember
          ? _ActiveMemberView(expiry: user?.membershipExpiry, price: price)
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: [
                _HeroCard(price: price),
                const SizedBox(height: 16),
                const _NeedTwoFramesCard(),
                const SizedBox(height: 24),
                const _BenefitsHeader(),
                const SizedBox(height: 12),
                const _BenefitsGrid(),
              ],
            ),
      bottomNavigationBar: isGoldMember
          ? null
          : _BuyNowBar(
              price: price,
              loading: _loading,
              onBuy: _activateMembership,
            ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  final int price;
  const _HeroCard({required this.price});

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConfig.resolveImageUrl('/images/gold_membership_hero.png');

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF121213), Color(0xFF0A0A0B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x40D4A04D)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '₹1 = 1 FRAME',
                  style: TextStyle(
                    color: Color(0xFFD4A04D),
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.4,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD4A04D),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'GOLD MEMBERS EXCLUSIVE',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const _CheckLine('SELECTED FRAMES ONLY'),
                const SizedBox(height: 6),
                const _CheckLine('FIRST ORDER BENEFIT'),
                const SizedBox(height: 6),
                const _CheckLine('PREMIUM EYEWEAR AT JUST ₹1'),
              ],
            ),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 132,
            height: 108,
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    width: 132,
                    height: 108,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: Colors.black26),
                    errorWidget: (_, __, ___) => Container(
                      color: const Color(0xFF111111),
                      child: const Icon(Icons.inventory_2_outlined, color: Color(0xFFD4A04D), size: 36),
                    ),
                  ),
                ),
                Positioned(
                  right: 6,
                  bottom: 6,
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.85),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFD4A04D)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '₹$price',
                          style: const TextStyle(
                            color: Color(0xFFD4A04D),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            height: 1,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          '/YEAR',
                          style: TextStyle(
                            color: Color(0xFF9CA3AF),
                            fontSize: 6.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                            height: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CheckLine extends StatelessWidget {
  final String text;
  const _CheckLine(this.text);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Text(
          '✓',
          style: TextStyle(color: Color(0xFFD4A04D), fontSize: 10, fontWeight: FontWeight.w900),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFFD1D5DB),
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.6,
            ),
          ),
        ),
      ],
    );
  }
}

class _NeedTwoFramesCard extends StatelessWidget {
  const _NeedTwoFramesCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF131315),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xCC2A2A2D)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0x1AD4A04D),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0x26D4A04D)),
            ),
            child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFFD4A04D), size: 18),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NEED 2 FRAMES?',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.4,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Get another frame for just ₹1 anytime before your membership expires.',
                  style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    height: 1.35,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  '⏱  VALID UNTIL YOUR GOLD MEMBERSHIP EXPIRY DATE',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text.rich(
                TextSpan(
                  style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900),
                  children: [
                    TextSpan(text: '₹1 + ₹1 = '),
                    TextSpan(
                      text: '₹2',
                      style: TextStyle(
                        color: Color(0xFFD4A04D),
                        decoration: TextDecoration.lineThrough,
                        decorationColor: Color(0xFFEF4444),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 2),
              Text(
                'TOTAL 2 FRAMES',
                style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 7,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BenefitsHeader extends StatelessWidget {
  const _BenefitsHeader();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.verified_outlined, color: Color(0xFFD4A04D), size: 16),
            SizedBox(width: 8),
            Text(
              'EYEGLAZE GOLD BENEFITS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
        SizedBox(height: 4),
        Padding(
          padding: EdgeInsets.only(left: 24),
          child: Text(
            'PREMIUM BENEFITS. MAXIMUM SAVINGS.',
            style: TextStyle(
              color: Color(0xFF6B7280),
              fontSize: 8.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
          ),
        ),
      ],
    );
  }
}

class _BenefitsGrid extends StatelessWidget {
  const _BenefitsGrid();

  static const _items = [
    (Icons.visibility_outlined, '₹1 PER FRAME', 'Get 1 frame for just ₹1. Take another for just ₹1 anytime. (Total 2 Frames = ₹2)'),
    (Icons.add_circle_outline, '1+1 FREE FRAMES', 'Buy 1 Get 1 Free on selected frames. Members Only.'),
    (Icons.account_balance_wallet_outlined, '90% WALLET REFUND', "If you don't take the second frame, get 90% refund to wallet. Valid for 30 days."),
    (Icons.trending_up, '15% CASHBACK', '15% cashback on selected frames. Members Only.'),
    (Icons.verified_outlined, 'FREE EYE TEST', 'Partner stores / camps to free eye test for you and your family.'),
    (Icons.headset_mic_outlined, 'PRIORITY SUPPORT', 'Fast response and priority assistance for all your orders.'),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.05,
      ),
      itemBuilder: (context, i) {
        final item = _items[i];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF121213),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xCC2A2A2D)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0x0DD4A04D),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0x26D4A04D)),
                ),
                child: Icon(item.$1, color: const Color(0xFFD4A04D), size: 16),
              ),
              const SizedBox(height: 10),
              Text(
                item.$2,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  item.$3,
                  style: const TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _BuyNowBar extends StatelessWidget {
  final int price;
  final bool loading;
  final VoidCallback onBuy;

  const _BuyNowBar({
    required this.price,
    required this.loading,
    required this.onBuy,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF0E0E0F),
      child: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xD92A2A2D))),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'JOIN GOLD MEMBERSHIP',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '₹$price',
                            style: const TextStyle(
                              color: Color(0xFFD4A04D),
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              height: 1,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            '/ YEAR ONLY',
                            style: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'UNLOCK ALL PREMIUM BENEFITS',
                        style: TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 7,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: loading ? null : onBuy,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFD4A04D), Color(0xFFB3823B)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: loading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                          )
                        : const Row(
                            children: [
                              Text(
                                'BUY NOW',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.4,
                                ),
                              ),
                              SizedBox(width: 6),
                              Text('➔', style: TextStyle(color: Colors.black, fontSize: 14)),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActiveMemberView extends StatelessWidget {
  final String? expiry;
  final int price;

  const _ActiveMemberView({required this.expiry, required this.price});

  @override
  Widget build(BuildContext context) {
    final expiryLabel = expiry != null
        ? DateFormat('d MMMM yyyy').format(DateTime.parse(expiry!))
        : '1 year from now';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        Text(
          'You are a Gold Member!',
          style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        Text(
          'Your membership expires on $expiryLabel',
          style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF121213), Color(0xFF0A0A0B)],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x59D4A04D)),
          ),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFF0D0C0A),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0x66D4A04D)),
                ),
                child: const Icon(Icons.workspace_premium, color: Color(0xFFD4A04D)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'GOLD MEMBERSHIP',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹$price / YEAR',
                      style: const TextStyle(
                        color: Color(0xFFD4A04D),
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0x40D4A04D),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color(0x66D4A04D)),
                ),
                child: const Text(
                  '✓ ACTIVE',
                  style: TextStyle(
                    color: Color(0xFFD4A04D),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const _BenefitsHeader(),
        const SizedBox(height: 12),
        const _BenefitsGrid(),
      ],
    );
  }
}
