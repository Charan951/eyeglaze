import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import '../orders/orders_screen.dart';
import '../products/wishlist_screen.dart';
import '../../widgets/responsive_container.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';
import '../../widgets/gold_button.dart';
import 'saved_addresses_screen.dart';
import 'membership_screen.dart';
import 'prescriptions_screen.dart';
import 'support_screen.dart';
import 'terms_screen.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final user = authService.currentUser;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'MY PROFILE',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 2.0,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ResponsiveContainer(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            children: [
              // User avatar & info Card
              Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E1B15), Color(0xFF0F0E0B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.25),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gold.withValues(alpha: 0.05),
                      blurRadius: 15,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          // Elegant Avatar with Gold Gradient Ring
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [AppColors.gold, Color(0xFF7A612A)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 30,
                              backgroundColor: AppColors.background,
                              child: Text(
                                user?.name?.isNotEmpty == true
                                    ? user!.name![0].toUpperCase()
                                    : 'U',
                                style: const TextStyle(
                                  color: AppColors.gold,
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          // User details
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user?.name ?? 'EyeGlaze User',
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 18,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                // Membership Badge
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: user?.membershipActive == true
                                        ? AppColors.gold.withValues(alpha: 0.15)
                                        : Colors.white.withValues(alpha: 0.05),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: user?.membershipActive == true
                                          ? AppColors.gold.withValues(
                                              alpha: 0.4,
                                            )
                                          : Colors.white.withValues(alpha: 0.1),
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        user?.membershipActive == true
                                            ? Icons.workspace_premium
                                            : Icons.person,
                                        size: 11,
                                        color: user?.membershipActive == true
                                            ? AppColors.gold
                                            : AppColors.muted,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        user?.membershipActive == true
                                            ? 'GOLD MEMBER'
                                            : 'CLASSIC MEMBER',
                                        style: TextStyle(
                                          color: user?.membershipActive == true
                                              ? AppColors.gold
                                              : AppColors.muted,
                                          fontSize: 8.5,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                if (user?.phone != null &&
                                    user!.phone!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 2),
                                    child: Row(
                                      children: [
                                        const Icon(
                                          Icons.phone_android,
                                          size: 12,
                                          color: AppColors.muted,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '+91 ${user.phone}',
                                          style: const TextStyle(
                                            color: AppColors.muted,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                if (user?.email != null &&
                                    user!.email!.isNotEmpty)
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.email_outlined,
                                        size: 12,
                                        color: AppColors.muted,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        user.email!,
                                        style: const TextStyle(
                                          color: AppColors.muted,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                              ],
                            ),
                          ),
                          // Edit Button
                          GestureDetector(
                            onTap: () => _showEditProfileBottomSheet(
                              context,
                              authService,
                              user,
                            ),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.gold.withValues(alpha: 0.2),
                                ),
                              ),
                              child: const Icon(
                                Icons.edit_outlined,
                                color: AppColors.gold,
                                size: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Divider
                    Container(
                      height: 1,
                      color: AppColors.border.withValues(alpha: 0.5),
                    ),
                    // Wallet row
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.account_balance_wallet_outlined,
                            color: AppColors.gold,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Wallet Balance',
                            style: TextStyle(
                              color: AppColors.muted,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '₹${user?.walletBalance.toStringAsFixed(2) ?? "0.00"}',
                            style: const TextStyle(
                              color: AppColors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Mini Add Money action
                          GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'To add money, use the WALLET tab on the home screen.',
                                  ),
                                  backgroundColor: AppColors.gold,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.gold,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                '+ ADD',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Grouped Sections
              _MenuSection(
                title: 'Shopping Experience',
                children: [
                  _MenuTile(
                    icon: Icons.shopping_bag_outlined,
                    label: 'My Orders',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const OrdersScreen()),
                      );
                    },
                  ),
                  _MenuTile(
                    icon: Icons.favorite_outline,
                    label: 'Wishlist',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const WishlistScreen(isStandalonePage: true),
                        ),
                      );
                    },
                  ),
                  _MenuTile(
                    icon: Icons.description_outlined,
                    label: 'My Prescriptions',
                    showDivider: false,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const PrescriptionsScreen()),
                      );
                    },
                  ),
                ],
              ),

              _MenuSection(
                title: 'Account Settings',
                children: [
                  _MenuTile(
                    icon: Icons.location_on_outlined,
                    label: 'Saved Addresses',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SavedAddressesScreen()),
                      );
                    },
                  ),
                  _MenuTile(
                    icon: Icons.workspace_premium_outlined,
                    label: 'EyeGlaze Membership',
                    showDivider: false,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const MembershipScreen()),
                      );
                    },
                  ),
                ],
              ),

              _MenuSection(
                title: 'Support & Info',
                children: [
                  _MenuTile(
                    icon: Icons.help_outline,
                    label: 'Help & Support',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SupportScreen()),
                      );
                    },
                  ),
                  _MenuTile(
                    icon: Icons.policy_outlined,
                    label: 'Terms & Privacy',
                    showDivider: false,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const TermsScreen()),
                      );
                    },
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Logout Button
              GestureDetector(
                onTap: () async {
                  await authService.clearToken();
                  if (context.mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (r) => false,
                    );
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.25),
                      width: 1.2,
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.logout, color: AppColors.error, size: 20),
                      SizedBox(width: 10),
                      Text(
                        'Logout Account',
                        style: TextStyle(
                          color: AppColors.error,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Footer Brand Slogan
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.auto_awesome, color: AppColors.gold, size: 12),
                  SizedBox(width: 6),
                  Text(
                    'EYEGLAZE EYEWEAR',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.auto_awesome, color: AppColors.gold, size: 12),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Premium Eyewear for Every Version of You.',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'v1.0.0',
                style: TextStyle(
                  color: Colors.white24,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditProfileBottomSheet(
    BuildContext context,
    AuthService authService,
    User? user,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
        ),
        child: _EditProfileBottomSheet(authService: authService, user: user),
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _MenuSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 6, bottom: 8, top: 20),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: AppColors.gold,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Column(children: children),
          ),
        ),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool showDivider;

  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // Icon wrapper
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: AppColors.gold, size: 18),
                  ),
                  const SizedBox(width: 14),
                  // Label
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        color: AppColors.white,
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // Chevron
                  const Icon(
                    Icons.chevron_right,
                    color: AppColors.muted,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ),
        if (showDivider)
          Container(
            margin: const EdgeInsets.only(left: 56), // align divider after icon
            height: 0.8,
            color: AppColors.border.withValues(alpha: 0.5),
          ),
      ],
    );
  }
}

class _EditProfileBottomSheet extends StatefulWidget {
  final AuthService authService;
  final User? user;

  const _EditProfileBottomSheet({required this.authService, this.user});

  @override
  State<_EditProfileBottomSheet> createState() =>
      _EditProfileBottomSheetState();
}

class _EditProfileBottomSheetState extends State<_EditProfileBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.user?.name ?? '');
    _emailCtrl = TextEditingController(text: widget.user?.email ?? '');
    _phoneCtrl = TextEditingController(text: widget.user?.phone ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final api = ApiService(widget.authService);
      final response = await api.updateProfile({
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
      });

      if (response['success'] == true && response['user'] != null) {
        final updatedUser = User.fromJson(response['user']);
        widget.authService.setUser(updatedUser);
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully!'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        throw response['error'] ?? 'Failed to update profile';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Edit Personal Info',
                  style: TextStyle(
                    color: AppColors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.close,
                    color: AppColors.muted,
                    size: 20,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameCtrl,
              style: const TextStyle(color: AppColors.white, fontSize: 14),
              decoration: const InputDecoration(
                labelText: 'Full Name',
                prefixIcon: Icon(
                  Icons.person_outline,
                  color: AppColors.gold,
                  size: 18,
                ),
              ),
              validator: (val) =>
                  val == null || val.isEmpty ? 'Name is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailCtrl,
              style: const TextStyle(color: AppColors.white, fontSize: 14),
              decoration: const InputDecoration(
                labelText: 'Email Address',
                prefixIcon: Icon(
                  Icons.email_outlined,
                  color: AppColors.gold,
                  size: 18,
                ),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (val) {
                if (val == null || val.isEmpty) return 'Email is required';
                if (!val.contains('@')) return 'Enter a valid email';
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneCtrl,
              style: const TextStyle(color: AppColors.white, fontSize: 14),
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                prefixText: '+91 ',
                prefixIcon: Icon(
                  Icons.phone_iphone,
                  color: AppColors.gold,
                  size: 18,
                ),
              ),
              keyboardType: TextInputType.phone,
              validator: (val) {
                if (val == null || val.isEmpty) {
                  return 'Phone number is required';
                }
                if (val.length < 10) return 'Enter a valid 10-digit number';
                return null;
              },
            ),
            const SizedBox(height: 24),
            GoldButton(
              label: 'SAVE CHANGES',
              onPressed: _loading ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}
