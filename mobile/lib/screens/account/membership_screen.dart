import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/user.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/gold_button.dart';
import '../../widgets/responsive_container.dart';
import 'package:intl/intl.dart';

class MembershipScreen extends StatefulWidget {
  const MembershipScreen({super.key});

  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  bool _loading = false;

  Future<void> _activateMembership() async {
    final authService = context.read<AuthService>();
    final currentUser = authService.currentUser;

    if (currentUser == null || currentUser.walletBalance < 129) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Insufficient wallet balance. Please add ₹129 to your wallet.',
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
        content: const Text(
          'Activate Gold Membership for ₹129/year?\n\nThis will be deducted from your wallet balance.',
          style: TextStyle(color: AppColors.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppColors.muted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Activate',
              style: TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.bold,
              ),
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
            SnackBar(
              content: Text('Error: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final user = authService.currentUser;
    final isGoldMember = user?.membershipActive ?? false;

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
          'EYEGLAZE MEMBERSHIP',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2,
          ),
        ),
      ),
      body: ResponsiveContainer(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isGoldMember
                        ? [const Color(0xFFC9A84C), const Color(0xFF8B7355)]
                        : [AppColors.card, AppColors.card],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isGoldMember ? AppColors.gold : AppColors.border,
                    width: 2,
                  ),
                  boxShadow: isGoldMember
                      ? [
                          BoxShadow(
                            color: AppColors.gold.withValues(alpha: 0.3),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ]
                      : null,
                ),
                child: Column(
                  children: [
                    Icon(
                      isGoldMember
                          ? Icons.workspace_premium
                          : Icons.workspace_premium_outlined,
                      size: 64,
                      color: isGoldMember ? Colors.black : AppColors.gold,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isGoldMember ? 'GOLD MEMBER' : 'CLASSIC MEMBER',
                      style: TextStyle(
                        color: isGoldMember ? Colors.black : AppColors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (isGoldMember && user?.membershipExpiry != null)
                      Text(
                        'Valid until: ${DateFormat('MMM dd, yyyy').format(DateTime.parse(user!.membershipExpiry!))}',
                        style: TextStyle(
                          color: isGoldMember
                              ? Colors.black87
                              : AppColors.muted,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    if (!isGoldMember)
                      Text(
                        'Upgrade to Gold for exclusive benefits!',
                        style: TextStyle(color: AppColors.muted, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'GOLD MEMBER BENEFITS',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 16),
              ..._buildBenefits(),
              const SizedBox(height: 32),
              if (!isGoldMember)
                GoldButton(
                  label: 'ACTIVATE GOLD MEMBERSHIP - ₹129/YEAR',
                  onPressed: _loading ? null : _activateMembership,
                  loading: _loading,
                ),
              if (isGoldMember)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.3),
                    ),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle, color: AppColors.gold, size: 28),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Your Gold Membership is active! Enjoy all the exclusive benefits.',
                          style: TextStyle(
                            color: AppColors.white,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildBenefits() {
    final benefits = [
      {
        'icon': Icons.discount_outlined,
        'title': '10% Off on Frames',
        'desc': 'Get 10% discount on all frame purchases',
      },
      {
        'icon': Icons.local_shipping_outlined,
        'title': 'Free Shipping',
        'desc': 'Free delivery on all orders',
      },
      {
        'icon': Icons.redeem_outlined,
        'title': 'Buy 1 Get 1',
        'desc': 'Exclusive Buy One Get One offers on select products',
      },
      {
        'icon': Icons.support_agent_outlined,
        'title': 'Priority Support',
        'desc': 'Get priority customer service',
      },
      {
        'icon': Icons.card_giftcard_outlined,
        'title': 'Early Access',
        'desc': 'Be the first to know about new launches',
      },
      {
        'icon': Icons.verified_outlined,
        'title': 'Extended Warranty',
        'desc': 'Extra 6 months warranty on all products',
      },
    ];

    return benefits.map((benefit) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                benefit['icon'] as IconData,
                color: AppColors.gold,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    benefit['title'] as String,
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    benefit['desc'] as String,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }
}
