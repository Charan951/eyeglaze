import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';
import '../../core/app_config.dart';
import '../../widgets/eyeglaze_logo.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../services/cart_provider.dart';
import '../../models/product.dart';
import '../../models/user.dart';
import '../products/products_screen.dart';
import '../products/product_detail_screen.dart';
import '../products/wishlist_screen.dart';
import '../cart/cart_screen.dart';
import '../orders/orders_screen.dart';
import '../account/account_screen.dart';
import '../../widgets/responsive_container.dart';

class HomeScreen extends StatefulWidget {
  // ignore: library_private_types_in_public_api
  static _HomeScreenState? state;
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTab = 0;

  final List<Widget> _tabs = const [
    _HomeBody(),
    WishlistScreen(isStandalonePage: false),
    OrdersScreen(),
  ];

  @override
  void initState() {
    super.initState();
    HomeScreen.state = this;
    // Load profile to sync user wallet/membership status
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthService>();
      if (auth.isLoggedIn) {
        final api = ApiService(auth);
        api.getProfile().then((res) {
          if (res['success'] == true && res['user'] != null) {
            auth.setUser(User.fromJson(res['user']));
          }
        }).catchError((_) {});
      }
    });
  }

  @override
  void dispose() {
    if (HomeScreen.state == this) {
      HomeScreen.state = null;
    }
    super.dispose();
  }

  void _showGoldMembershipSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.black,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _GoldMembershipSheet(),
    );
  }

  void _showWalletSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.black,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _WalletSheet(),
    );
  }

  Widget _buildCustomBottomBar() {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0A0A0A),
        border: Border(
          top: BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Home Tab
              Expanded(
                child: _buildBottomTabItem(
                  index: 0,
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home,
                  label: 'HOME',
                ),
              ),
              // Wishlist Tab
              Expanded(
                child: _buildBottomTabItem(
                  index: 1,
                  icon: Icons.favorite_border,
                  activeIcon: Icons.favorite,
                  label: 'WISHLIST',
                ),
              ),
              // GET GOLD Center Button
              GestureDetector(
                onTap: () => _showGoldMembershipSheet(context),
                child: Container(
                  width: 110,
                  height: 48,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.6)),
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF1C160E), Color(0xFF0A0704)],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      // Badge at the top
                      Positioned(
                        top: -8,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.gold,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'GET GOLD',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 6.5,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(height: 4),
                            const Icon(Icons.star, color: AppColors.gold, size: 14),
                            const SizedBox(height: 2),
                            const Text(
                              'GET GOLD',
                              style: TextStyle(
                                color: AppColors.gold,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              'Unlock Benefits',
                              style: TextStyle(
                                color: AppColors.white.withValues(alpha: 0.5),
                                fontSize: 5.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Orders Tab
              Expanded(
                child: _buildBottomTabItem(
                  index: 2,
                  icon: Icons.shopping_bag_outlined,
                  activeIcon: Icons.shopping_bag,
                  label: 'ORDERS',
                ),
              ),
              // Wallet Trigger
              Expanded(
                child: GestureDetector(
                  onTap: () => _showWalletSheet(context),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.account_balance_wallet_outlined,
                        color: AppColors.muted,
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'WALLET',
                        style: TextStyle(
                          color: AppColors.muted,
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomTabItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isActive = _currentTab == index;
    final color = isActive ? AppColors.gold : AppColors.muted;
    return GestureDetector(
      onTap: () {
        setState(() => _currentTab = index);
      },
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isActive ? activeIcon : icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 8,
              fontWeight: isActive ? FontWeight.w900 : FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = context.watch<CartProvider>().itemCount;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        scrolledUnderElevation: 0,
        leading: Consumer<AuthService>(
          builder: (context, auth, _) {
            final user = auth.currentUser;
            if (user != null) {
              return GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AccountScreen()),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white24),
                    ),
                    child: const Icon(Icons.person_outline, color: Colors.white, size: 18),
                  ),
                ),
              );
            } else {
              return IconButton(
                icon: const Icon(Icons.menu, color: AppColors.white),
                onPressed: () {},
              );
            }
          },
        ),
        title: const EyeGlazeLogo(),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.white),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductsScreen()),
              );
            },
          ),
          Stack(
            children: [
              IconButton(icon: const Icon(Icons.notifications_outlined, color: AppColors.white), onPressed: () {}),
              Positioned(
                right: 8, top: 8,
                child: Container(
                  width: 14, height: 14,
                  decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
                  child: const Center(child: Text('3', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))),
                ),
              ),
            ],
          ),
        ],
      ),
      body: ResponsiveContainer(
        maxWidth: 600,
        child: _tabs[_currentTab],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.card,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
          side: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CartScreen()),
          );
        },
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.shopping_bag_outlined, color: AppColors.gold, size: 24),
            if (cartCount > 0)
              Positioned(
                right: -6,
                top: -6,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Center(
                    child: Text(
                      '$cartCount',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      bottomNavigationBar: _buildCustomBottomBar(),
    );
  }
}

class _HomeBody extends StatefulWidget {
  const _HomeBody();

  @override
  State<_HomeBody> createState() => _HomeBodyState();
}

class _HomeBodyState extends State<_HomeBody> {
  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _GreetingsHeader(),
          _OfferCoupons(),
          _CategoryGrids(),
          _FeaturedProducts(),
          _PromoBanners(),
          SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _GreetingsHeader extends StatelessWidget {
  const _GreetingsHeader();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;
    final name = user?.name ?? 'Guest';

    final hour = DateTime.now().hour;
    String timeGreeting = 'Good Morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good Afternoon';
    } else if (hour >= 17 || hour < 4) {
      timeGreeting = 'Good Evening';
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Hello, $name',
                style: const TextStyle(
                  color: AppColors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.waving_hand,
                color: AppColors.gold,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '$timeGreeting! Ready to find your perfect fit?',
            style: const TextStyle(
              color: AppColors.muted,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _OfferCoupons extends StatefulWidget {
  const _OfferCoupons();

  @override
  State<_OfferCoupons> createState() => _OfferCouponsState();
}

class _OfferCouponsState extends State<_OfferCoupons> {
  List<dynamic> _coupons = [];
  bool _loading = false;
  final PageController _pageController = PageController();
  int _activeSlide = 0;
  String? _copiedCode;
  Timer? _autoScrollTimer;

  String _getCouponBgImage(String code, String name) {
    final c = code.toLowerCase();
    final n = name.toLowerCase();
    
    if (c.contains('gold') || c.contains('50') || n.contains('50%')) {
      return '/images/sale_eyeglasses.png';
    }
    if (c.contains('coat') || n.contains('coat') || n.contains('glare')) {
      return '/images/cat_blue_light.png';
    }
    if (c.contains('welcome') || c.contains('new') || n.contains('welcome') || n.contains('new')) {
      return '/images/hero_model.png';
    }
    // Fallbacks
    if (c.contains('sun')) {
      return '/images/sale_sunglasses.png';
    }
    return '/images/promo_new_arrivals.png';
  }

  @override
  void initState() {
    super.initState();
    _loadCoupons();

    // Connect socket listener
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        try {
          final socketService = context.read<SocketService>();
          socketService.socket?.on('coupon_changed', _onCouponChanged);
        } catch (_) {}
      }
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('coupon_changed', _onCouponChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onCouponChanged(dynamic data) {
    if (mounted) {
      _loadCoupons();
    }
  }

  void _startAutoPlay() {
    _autoScrollTimer?.cancel();
    if (_coupons.length <= 1) return;
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted) return;
      if (_pageController.hasClients) {
        final next = (_activeSlide + 1) % _coupons.length;
        _pageController.animateToPage(
          next,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _loadCoupons() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final res = await api.getActiveCoupons();
      if (mounted) {
        setState(() {
          _coupons = res['coupons'] ?? [];
          _loading = false;
        });
        _startAutoPlay();
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Widget _buildCouponCard(dynamic coupon) {
    final code = (coupon['code'] ?? '').toString().toUpperCase();
    final badge = (coupon['badge'] ?? 'OFFER').toString().toUpperCase();
    final name = (coupon['name'] ?? 'DISCOUNT VOUCHER').toString().toUpperCase();
    final description = coupon['description'] ?? 'Apply this promo code at checkout to claim your deal.';
    final discountType = coupon['discountType'] ?? 'percent';
    final discountValue = coupon['discountValue'] ?? 0;
    final minOrderValue = coupon['minOrderValue'];

    final discountText = discountType == 'percent'
        ? "SAVE $discountValue% ON YOUR ORDER"
        : "FLAT ₹$discountValue DISCOUNT INSTANTLY";

    final isCopied = _copiedCode == code;
    final bgPath = _getCouponBgImage(code, name);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF2A2A2D)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Background Image
            Positioned.fill(
              child: CachedNetworkImage(
                imageUrl: AppConfig.resolveImageUrl(bgPath),
                fit: BoxFit.cover,
                errorWidget: (context, url, error) => Container(
                  color: const Color(0xFF151515),
                ),
              ),
            ),
            // Gradient Overlay for high readability
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Colors.black.withValues(alpha: 0.9),
                      Colors.black.withValues(alpha: 0.7),
                      Colors.black.withValues(alpha: 0.95),
                    ],
                  ),
                ),
              ),
            ),
            // Gold glow effect
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gold.withValues(alpha: 0.05),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.15),
                          border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          badge,
                          style: const TextStyle(
                            color: AppColors.gold,
                            fontSize: 7.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      if (minOrderValue != null)
                        Text(
                          "MIN. SPEND: ₹$minOrderValue",
                          style: TextStyle(
                            color: AppColors.white.withValues(alpha: 0.6),
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    name,
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      shadows: [
                        Shadow(color: Colors.black54, offset: Offset(0, 1), blurRadius: 2),
                      ],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    discountText,
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: TextStyle(
                      color: AppColors.white.withValues(alpha: 0.75),
                      fontSize: 9.5,
                      height: 1.25,
                      shadows: const [
                        Shadow(color: Colors.black54, offset: Offset(0, 1), blurRadius: 1),
                      ],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0B0B0C).withValues(alpha: 0.8),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: AppColors.gold.withValues(alpha: 0.3),
                              style: BorderStyle.solid,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              code,
                              style: const TextStyle(
                                color: AppColors.gold,
                                fontFamily: 'monospace',
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: code));
                          setState(() {
                            _copiedCode = code;
                          });
                          Future.delayed(const Duration(seconds: 2), () {
                            if (mounted && _copiedCode == code) {
                              setState(() {
                                _copiedCode = null;
                              });
                            }
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Coupon code "$code" copied to clipboard!'),
                              backgroundColor: AppColors.success,
                              duration: const Duration(seconds: 1),
                            ),
                          );
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: isCopied ? AppColors.success : AppColors.gold,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: (isCopied ? AppColors.success : AppColors.gold).withValues(alpha: 0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            isCopied ? "✓ COPIED" : "COPY CODE",
                            style: TextStyle(
                              color: isCopied ? Colors.white : Colors.black,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox.shrink();
    }
    if (_coupons.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            'EXCLUSIVE DEALS',
            style: TextStyle(
              color: AppColors.white,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
        ),
        SizedBox(
          height: 185,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (idx) {
              setState(() {
                _activeSlide = idx;
              });
            },
            itemCount: _coupons.length,
            itemBuilder: (context, index) {
              final coupon = _coupons[index];
              return _buildCouponCard(coupon);
            },
          ),
        ),
        if (_coupons.length > 1) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _coupons.length,
              (idx) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _activeSlide == idx ? 12 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: _activeSlide == idx ? AppColors.gold : AppColors.muted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: 16),
      ],
    );
  }
}


class _CategoryCard extends StatelessWidget {
  final String label;
  final String imagePath;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.label,
    required this.imagePath,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background Image
              CachedNetworkImage(
                imageUrl: AppConfig.resolveImageUrl(imagePath),
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                errorWidget: (context, url, error) => const Center(
                  child: Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 24),
                ),
              ),
              // Gradient Overlay
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.5),
                      Colors.black.withValues(alpha: 0.85),
                    ],
                    stops: const [0.5, 0.8, 1.0],
                  ),
                ),
              ),
              // Bottom Text
              Positioned(
                bottom: 6,
                left: 4,
                right: 4,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 8.5,
                        fontWeight: FontWeight.w900,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 1),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Shop Now',
                          style: TextStyle(
                            color: AppColors.gold,
                            fontSize: 6,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(width: 1),
                        Icon(
                          Icons.arrow_forward,
                          color: AppColors.gold,
                          size: 6,
                        ),
                      ],
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
}

class _CategoryGrids extends StatefulWidget {
  const _CategoryGrids();

  @override
  State<_CategoryGrids> createState() => _CategoryGridsState();
}

class _CategoryGridsState extends State<_CategoryGrids> {
  List<dynamic> _categoriesList = [];
  bool _loading = false;

  final List<dynamic> _fallbackCategories = [
    {'name': 'Prescription', 'code': 'prescription', 'slug': 'prescription'},
    {'name': 'Sunglasses', 'code': 'sunglasses', 'slug': 'sunglasses'},
    {'name': 'Reading Glasses', 'code': 'reading-glasses', 'slug': 'reading-glasses'},
    {'name': 'Contact Lenses', 'code': 'contact-lenses', 'slug': 'contact-lenses'},
    {'name': 'Accessories', 'code': 'accessories', 'slug': 'accessories'},
    {'name': 'Kids', 'code': 'kids', 'slug': 'kids'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    
    // Connect socket listener
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final socketService = context.read<SocketService>();
        socketService.socket?.on('category_changed', _onCategoryChanged);
      }
    });
  }

  @override
  void dispose() {
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('category_changed', _onCategoryChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onCategoryChanged(dynamic data) {
    if (kDebugMode) {
      print('Socket: category_changed event received on home category grids: $data');
    }
    if (mounted) {
      _loadCategories();
    }
  }

  Future<void> _loadCategories() async {
    if (mounted) setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final list = await api.getCategories();
      if (mounted) {
        setState(() {
          _categoriesList = list.isNotEmpty ? list : _fallbackCategories;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _categoriesList = _fallbackCategories;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showShapeSelectionSheet(BuildContext context, {required String title, required String category, String? gender}) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return _ShapeSelectionSheet(title: title, category: category, gender: gender);
      },
    );
  }

  List<Map<String, dynamic>> _getCategorySubOptions(dynamic cat) {
    final slug = (cat['slug'] ?? '').toString().toLowerCase();

    if (slug == 'eyeglasses' || slug == 'prescription') {
      return [
        { 'label': 'Men', 'imagePath': '/images/men_eyeglasses.png', 'category': cat['slug'], 'gender': 'men', 'shapeModal': true },
        { 'label': 'Women', 'imagePath': '/images/women_eyeglasses.png', 'category': cat['slug'], 'gender': 'women', 'shapeModal': true },
        { 'label': 'Kids', 'imagePath': '/images/kids_eyeglasses.png', 'category': cat['slug'], 'gender': 'kids', 'shapeModal': true },
        { 'label': 'Contact Lens', 'imagePath': '/images/cat_contacts.png', 'category': 'contact-lenses', 'shapeModal': false }
      ];
    }

    if (slug == 'sunglasses') {
      return [
        { 'label': 'Men', 'imagePath': '/images/men_sunglasses.png', 'category': cat['slug'], 'gender': 'men', 'shapeModal': true },
        { 'label': 'Women', 'imagePath': '/images/women_sunglasses.png', 'category': cat['slug'], 'gender': 'women', 'shapeModal': true },
        { 'label': 'Kids', 'imagePath': '/images/kids_sunglasses.png', 'category': cat['slug'], 'gender': 'kids', 'shapeModal': true },
        { 'label': 'Accessories', 'imagePath': '/images/accessories.png', 'category': 'accessories', 'shapeModal': false }
      ];
    }

    if (slug == 'reading-glasses') {
      return [
        { 'label': 'Zero Power', 'imagePath': '/images/zero_power_glasses.png', 'category': 'zero-power', 'shapeModal': true },
        { 'label': 'Reading', 'imagePath': '/images/reading_book.png', 'category': cat['slug'], 'shapeModal': true },
        { 'label': 'Power Sun', 'imagePath': '/images/transition_lens.png', 'category': 'sunglasses', 'shapeModal': true }
      ];
    }

    if (slug == 'contact-lenses') {
      return [
        { 'label': 'Clear Lenses', 'imagePath': '/images/cat_contacts.png', 'category': cat['slug'], 'shapeModal': false },
        { 'label': 'Color Lenses', 'imagePath': '/images/cat_contacts.png', 'category': cat['slug'], 'shapeModal': false },
        { 'label': 'Solutions', 'imagePath': '/images/accessories.png', 'category': cat['slug'], 'shapeModal': false },
        { 'label': 'View More', 'imagePath': cat['bannerImage'] ?? '/images/cat_contacts.png', 'category': cat['slug'], 'shapeModal': false }
      ];
    }

    // Default generic sub-options for any dynamic category
    return [
      { 'label': 'Men', 'imagePath': '/images/men_eyeglasses.png', 'category': cat['slug'], 'gender': 'men', 'shapeModal': true },
      { 'label': 'Women', 'imagePath': '/images/women_eyeglasses.png', 'category': cat['slug'], 'gender': 'women', 'shapeModal': true },
      { 'label': 'Kids', 'imagePath': '/images/kids_eyeglasses.png', 'category': cat['slug'], 'gender': 'kids', 'shapeModal': true },
      { 'label': 'View More', 'imagePath': cat['bannerImage'] ?? '/images/hero_model.png', 'category': cat['slug'], 'shapeModal': false }
    ];
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator(color: AppColors.gold)),
      );
    }

    final List<Widget> sections = [];

    // Group the categories to replicate standard layout
    final eyeglassesCat = _categoriesList.firstWhere(
      (c) => c['slug'] == 'prescription' || c['slug'] == 'eyeglasses',
      orElse: () => null,
    );
    final sunglassesCat = _categoriesList.firstWhere(
      (c) => c['slug'] == 'sunglasses',
      orElse: () => null,
    );
    final readingCat = _categoriesList.firstWhere(
      (c) => c['slug'] == 'reading-glasses',
      orElse: () => null,
    );

    final knownSlugs = ['prescription', 'eyeglasses', 'sunglasses', 'reading-glasses', 'contact-lenses', 'accessories', 'kids'];
    final dynamicCats = _categoriesList.where((c) => !knownSlugs.contains(c['slug']?.toString().toLowerCase())).toList();

    if (eyeglassesCat != null) {
      sections.add(_buildSection(eyeglassesCat));
      sections.add(const SizedBox(height: 16));
    }
    if (sunglassesCat != null) {
      sections.add(_buildSection(sunglassesCat));
      sections.add(const SizedBox(height: 16));
    }
    if (readingCat != null) {
      sections.add(_buildSection(readingCat));
      sections.add(const SizedBox(height: 16));
    }

    for (final dynamicCat in dynamicCats) {
      sections.add(_buildSection(dynamicCat));
      sections.add(const SizedBox(height: 16));
    }

    if (sections.isEmpty) {
      return const SizedBox.shrink();
    }

    sections.removeLast();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: sections,
      ),
    );
  }

  Widget _buildSection(dynamic cat) {
    final subOptions = _getCategorySubOptions(cat);
    final title = (cat['name'] ?? cat['code'] ?? '').toString().toUpperCase();

    final crossCount = subOptions.length == 3 ? 3 : 4;
    final aspect = subOptions.length == 3 ? 1.35 / 1 : 3 / 4.2;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
        const SizedBox(height: 8),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossCount,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: aspect,
          children: subOptions.map((opt) {
            return _CategoryCard(
              label: opt['label'],
              imagePath: opt['imagePath'],
              onTap: () {
                if (opt['shapeModal'] == true) {
                  _showShapeSelectionSheet(
                    context,
                    title: "${opt['label']}'s ${cat['name'] ?? ''}",
                    category: opt['category'],
                    gender: opt['gender'],
                  );
                } else {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProductsScreen(
                        category: opt['category'],
                        gender: opt['gender'],
                      ),
                    ),
                  );
                }
              },
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _PromoBanners extends StatelessWidget {
  const _PromoBanners();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 140,
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('UP TO', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                  const Text('50% OFF', style: TextStyle(color: AppColors.gold, fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  const Text('On Selected\nSunglasses', style: TextStyle(color: AppColors.white, fontSize: 11), maxLines: 2),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Sunglasses'))),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(6)),
                      child: const Text('SHOP NOW', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              height: 140,
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.gold, width: 0.5),
              ),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('NEW', style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold)),
                  const Text('ARRIVALS', style: TextStyle(color: AppColors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  const Text('Just In! Latest\ntrends in eyewear', style: TextStyle(color: AppColors.muted, fontSize: 11), maxLines: 2),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen())),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(border: Border.all(color: AppColors.gold), borderRadius: BorderRadius.circular(6)),
                      child: const Text('EXPLORE', style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturedProducts extends StatefulWidget {
  const _FeaturedProducts();

  @override
  State<_FeaturedProducts> createState() => _FeaturedProductsState();
}

class _FeaturedProductsState extends State<_FeaturedProducts> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadBestsellers();

    // Connect socket listener
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final socketService = context.read<SocketService>();
        socketService.socket?.on('product_changed', _onProductChanged);
      }
    });
  }

  @override
  void dispose() {
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('product_changed', _onProductChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onProductChanged(dynamic data) {
    if (kDebugMode) {
      print('Socket: product_changed event received on home featured products: $data');
    }
    if (mounted) {
      _loadBestsellers();
    }
  }

  Future<void> _loadBestsellers() async {
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final data = await api.getProducts(sort: 'bestseller');
      final list = (data['products'] ?? data['data'] ?? []) as List;
      if (mounted) {
        setState(() {
          _products = list.map((p) => Product.fromJson(p)).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _products = _demoFeaturedProducts();
          _loading = false;
        });
      }
    }
  }

  List<Product> _demoFeaturedProducts() => [
        Product(
          id: '1',
          sku: 'EG-2041',
          name: 'Matte Square Frame',
          originalPrice: 999,
          sellingPrice: 1,
          rating: 4.7,
          reviewCount: 198,
          soldCount: 400,
          isBestseller: true,
          images: ['/images/cat_prescription.png'],
        ),
        Product(
          id: '2',
          sku: 'EG-1067',
          name: 'Premium Clubmaster Frame',
          originalPrice: 999,
          sellingPrice: 1,
          rating: 4.5,
          reviewCount: 124,
          soldCount: 250,
          isBestseller: true,
          images: ['/images/cat_sunglasses.png'],
        ),
      ];

  @override
  Widget build(BuildContext context) {
    if (!_loading && _products.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Featured Products', style: AppTextStyles.heading3),
                  SizedBox(height: 2),
                  Text('EyeGlaze Bestsellers of the week', style: TextStyle(color: AppColors.muted, fontSize: 10)),
                ],
              ),
              GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen())),
                child: const Text('Explore All ›', style: AppTextStyles.gold),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 240,
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
              : ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _products.length,
                  itemBuilder: (_, i) => _FeaturedProductCard(
                    product: _products[i],
                    onTap: () => Navigator.push(context, MaterialPageRoute(
                      builder: (_) => ProductDetailScreen(product: _products[i]),
                    )),
                  ),
                ),
        ),
      ],
    );
  }
}

class _FeaturedProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;

  const _FeaturedProductCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final discount = product.originalPrice > product.sellingPrice
        ? ((product.originalPrice - product.sellingPrice) / product.originalPrice * 100).round()
        : 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                    ),
                    width: double.infinity,
                    height: double.infinity,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                      child: product.images.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: AppConfig.resolveImageUrl(product.images.first),
                              fit: BoxFit.contain,
                              placeholder: (context, url) => const Center(
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2),
                                ),
                              ),
                              errorWidget: (context, url, error) => const Icon(
                                Icons.broken_image_outlined,
                                color: AppColors.muted,
                                size: 30,
                              ),
                            )
                          : const Icon(
                              Icons.visibility_outlined,
                              color: AppColors.muted,
                              size: 40,
                            ),
                    ),
                  ),
                  if (product.isBestseller)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.gold,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('BESTSELLER', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.sku,
                    style: const TextStyle(color: AppColors.muted, fontSize: 9),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    product.name,
                    style: const TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, color: AppColors.gold, size: 10),
                      const SizedBox(width: 2),
                      Text('${product.rating}', style: const TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 4),
                      Text('(${product.reviewCount})', style: const TextStyle(color: AppColors.muted, fontSize: 9)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text('₹${product.sellingPrice.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                          const SizedBox(width: 4),
                          Text('₹${product.originalPrice.toInt()}', style: const TextStyle(color: AppColors.muted, decoration: TextDecoration.lineThrough, fontSize: 10)),
                        ],
                      ),
                      if (discount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4)),
                          child: Text('$discount%', style: const TextStyle(color: AppColors.gold, fontSize: 9, fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoldMembershipSheet extends StatefulWidget {
  const _GoldMembershipSheet();

  @override
  State<_GoldMembershipSheet> createState() => _GoldMembershipSheetState();
}

class _GoldMembershipSheetState extends State<_GoldMembershipSheet> {
  bool _loading = false;
  String? _error;
  bool _success = false;

  Future<void> _activateMembership() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);

      final res = await api.activateMembership();
      if (res['success'] == true) {
        final profileRes = await api.getProfile();
        if (profileRes['success'] == true && profileRes['user'] != null) {
          auth.setUser(User.fromJson(profileRes['user']));
        }
        setState(() => _success = true);
      } else {
        setState(() => _error = res['error'] ?? 'Activation failed');
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _quickAddAndActivate() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final user = auth.currentUser;

      if (user != null) {
        final needed = (129.0 - user.walletBalance).clamp(0.0, 99999.0);
        if (needed > 0) {
          await api.addWalletMoney(needed);
        }
        final res = await api.activateMembership();
        if (res['success'] == true) {
          final profileRes = await api.getProfile();
          if (profileRes['success'] == true && profileRes['user'] != null) {
            auth.setUser(User.fromJson(profileRes['user']));
          }
          setState(() => _success = true);
        } else {
          setState(() => _error = res['error'] ?? 'Activation failed');
        }
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;

    if (_success) {
      return Container(
        padding: const EdgeInsets.all(24),
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('👑', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text('Congratulations!', style: TextStyle(color: AppColors.white, fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Text(
              'You are now an EYEGLAZE GOLD MEMBER. Enjoy ₹1 frame exclusives, 1+1 free styling, priority support, and premium benefits!',
              style: TextStyle(color: AppColors.muted, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('START SHOPPING'),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.only(top: 16),
      height: MediaQuery.of(context).size.height * 0.85,
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppColors.white),
                  onPressed: () => Navigator.pop(context),
                ),
                const Column(
                  children: [
                    Text(
                      'EYEGLAZE',
                      style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 2),
                    ),
                    Text(
                      'GOLD MEMBERSHIP',
                      style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.gold),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text('BEST VALUE', style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.border, height: 20),

          // Scrollable Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Gold Card Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF1E1911), Color(0xFF050506)],
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('₹1 = 1 FRAME', style: TextStyle(color: AppColors.gold, fontSize: 22, fontWeight: FontWeight.w900)),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)),
                                child: const Text('GOLD MEMBERS EXCLUSIVE', style: TextStyle(color: Colors.black, fontSize: 7, fontWeight: FontWeight.w900)),
                              ),
                              const SizedBox(height: 12),
                              _buildBulletPoint('Selected Frames Only'),
                              _buildBulletPoint('First Order Benefit'),
                              _buildBulletPoint('Premium Eyewear at Just ₹1'),
                            ],
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                width: 70,
                                height: 70,
                                decoration: BoxDecoration(
                                  color: Colors.black,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppColors.gold, width: 2),
                                ),
                                child: const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('FEE ONLY', style: TextStyle(color: AppColors.muted, fontSize: 6, fontWeight: FontWeight.bold)),
                                    Text('₹129', style: TextStyle(color: AppColors.gold, fontSize: 16, fontWeight: FontWeight.w900)),
                                    Text('/ YEAR', style: TextStyle(color: AppColors.muted, fontSize: 6, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Need 2 Frames Block
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const Text('🛒', style: TextStyle(fontSize: 20)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('NEED 2 FRAMES?', style: TextStyle(color: AppColors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              Text(
                                'Get another frame for just ₹1 anytime before expiry.',
                                style: TextStyle(color: AppColors.white.withValues(alpha: 0.5), fontSize: 8),
                              ),
                            ],
                          ),
                        ),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('👓 ₹1 + 👓 ₹1 = ₹2', style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold)),
                            Text('TOTAL 2 FRAMES', style: TextStyle(color: AppColors.muted, fontSize: 7, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Error Display
                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text('⚠️', style: TextStyle(fontSize: 12)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 11, fontWeight: FontWeight.w500)),
                              ),
                            ],
                          ),
                          if (_error!.contains('balance') || _error!.contains('Balance')) ...[
                            const SizedBox(height: 8),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _loading ? null : _quickAddAndActivate,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.gold,
                                  minimumSize: const Size(double.infinity, 36),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('Add Wallet Money & Activate Now', style: TextStyle(fontSize: 10, color: Colors.black)),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Benefits checklist
                  const Text('MEMBERSHIP BENEFITS', style: TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 2.2,
                    children: [
                      _buildBenefitTile('👓', '₹1 PER FRAME', 'Get 1 frame for ₹1. Take another for ₹1.'),
                      _buildBenefitTile('➕', '1+1 FREE FRAMES', 'Buy 1 Get 1 Free on selected frames.'),
                      _buildBenefitTile('💰', '90% REFUND', 'Wallet refund if second pair not taken.'),
                      _buildBenefitTile('📉', '15% CASHBACK', 'Get cashback on select eyeglasses.'),
                      _buildBenefitTile('🩺', 'FREE EYE TEST', 'Optometrist checkup camps.'),
                      _buildBenefitTile('📞', 'PRIORITY HELP', 'Skip queue customer support.'),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Savings Table
                  const Text('HOW MUCH YOU SAVE', style: TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Table(
                        columnWidths: const {
                          0: FlexColumnWidth(2),
                          1: FlexColumnWidth(1.2),
                          2: FlexColumnWidth(1.8),
                        },
                        children: [
                          const TableRow(
                            decoration: BoxDecoration(color: Color(0xFF151516)),
                            children: [
                              Padding(padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8), child: Text('BENEFIT', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))),
                              Padding(padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8), child: Text('SAVE', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              Padding(padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8), child: Text('ANNUAL VALUE', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold), textAlign: TextAlign.right)),
                            ],
                          ),
                          _buildTableRow('2 Frames for ₹2', '₹1,998', 'Up to ₹4,998'),
                          _buildTableRow('1+1 Free Frames', '₹1,998', 'Up to ₹1,998'),
                          _buildTableRow('15% Cashback', '₹1,000+', 'On selected frames'),
                          _buildTableRow('Free Eye Test', '₹500', 'At partner store'),
                          _buildTableRow('Contact Lens Solution', '₹500+', 'Solution box free'),
                          TableRow(
                            decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.08)),
                            children: [
                              Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10), child: Text('TOTAL SAVINGS', style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold))),
                              Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10), child: Text('₹7,000+', style: const TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                child: Text('Fee: ₹129 only!', style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 7, fontWeight: FontWeight.bold), textAlign: TextAlign.right),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Sticky Bottom Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF0A0A0B),
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('JOIN GOLD MEMBERSHIP', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text('₹129', style: TextStyle(color: AppColors.gold, fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          Text('/ Year', style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 9, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                  if (user?.membershipActive == true)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle_outline, color: Colors.green, size: 14),
                          SizedBox(width: 6),
                          Text('ACTIVE MEMBER', style: TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    )
                  else
                    SizedBox(
                      width: 50,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _activateMembership,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          shape: const CircleBorder(),
                          padding: EdgeInsets.zero,
                        ),
                        child: _loading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                            : const Icon(Icons.arrow_forward, color: Colors.black),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          const Icon(Icons.check, color: AppColors.gold, size: 12),
          const SizedBox(width: 6),
          Text(text, style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 8.5, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBenefitTile(String icon, String title, String desc) {
    return Container(
      padding: const EdgeInsets.all(8),
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
              Text(icon, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 8.5, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 7, height: 1.1),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  TableRow _buildTableRow(String name, String save, String val) {
    return TableRow(
      children: [
        Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7), child: Text(name, style: const TextStyle(color: Colors.white, fontSize: 8))),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7), child: Text(save, style: const TextStyle(color: Colors.green, fontSize: 8, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7), child: Text(val, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 8), textAlign: TextAlign.right)),
      ],
    );
  }
}

class _WalletSheet extends StatefulWidget {
  const _WalletSheet();

  @override
  State<_WalletSheet> createState() => _WalletSheetState();
}

class _WalletSheetState extends State<_WalletSheet> {
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;

    return Container(
      padding: const EdgeInsets.all(16),
      height: MediaQuery.of(context).size.height * 0.65,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('💳', style: TextStyle(fontSize: 22)),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('EYEGLAZE WALLET', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      Text('Manage Balance & Cashback', style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 8)),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppColors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 20),
          const SizedBox(height: 10),

          // Balance Card
          Container(
            padding: const EdgeInsets.all(20),
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF1C1A16), Color(0xFF0D0D0E)],
              ),
            ),
            child: Column(
              children: [
                const Text('AVAILABLE BALANCE', style: TextStyle(color: AppColors.muted, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(
                  '₹${user != null ? user.walletBalance.toStringAsFixed(2) : "0.00"}',
                  style: TextStyle(color: AppColors.gold, fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                const Text('✓ 100% usable on next order', style: TextStyle(color: Colors.green, fontSize: 8.5, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Recent Activity
          const Text('RECENT ACTIVITY', style: TextStyle(color: AppColors.white, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Expanded(
            child: user != null && user.transactions != null && user.transactions!.isNotEmpty
                ? ListView.builder(
                    itemCount: user.transactions!.length,
                    itemBuilder: (context, i) {
                      final tx = user.transactions![user.transactions!.length - 1 - i];
                      final isPaid = tx['type'] == 'Paid';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  tx['description'] ?? 'Transaction',
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  tx['date'] != null
                                      ? DateTime.parse(tx['date']).toLocal().toString().split(' ')[0]
                                      : 'Recent',
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 8),
                                ),
                              ],
                            ),
                            Text(
                              '${isPaid ? "-" : "+"}₹${tx['amount']}',
                              style: TextStyle(
                                color: isPaid ? Colors.redAccent : Colors.green,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  )
                : ListView(
                    children: [
                      _buildMockTxTile('Sign-up Bonus Credit', 'Jun 18, 2026', '+₹100', Colors.green),
                      _buildMockTxTile('Referral Cashback Reward', 'Jun 15, 2026', '+₹400', Colors.green),
                    ],
                  ),
          ),
          const SizedBox(height: 16),

          // Footer buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        backgroundColor: AppColors.card,
                        title: const Text('Invite Friends', style: TextStyle(color: Colors.white)),
                        content: const Text(
                          'Referrals are credited instantly! Share link with friends:\nhttps://web.eyeglaze.in/invite',
                          style: TextStyle(color: AppColors.muted, fontSize: 13),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('OK', style: TextStyle(color: AppColors.gold)),
                          ),
                        ],
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.border),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('REFER & EARN', style: TextStyle(fontSize: 10)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gold,
                  ),
                  child: const Text('CLOSE', style: TextStyle(fontSize: 10, color: Colors.black)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMockTxTile(String title, String date, String amount, Color color) {
    return Opacity(
      opacity: 0.55,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(date, style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 8)),
              ],
            ),
            Text(amount, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}

class _ShapeSelectionSheet extends StatelessWidget {
  final String title;
  final String category;
  final String? gender;

  const _ShapeSelectionSheet({
    required this.title,
    required this.category,
    this.gender,
  });

  @override
  Widget build(BuildContext context) {
    // 4 shapes to select
    final shapes = [
      {'label': 'Square', 'value': 'Square'},
      {'label': 'Rectangle', 'value': 'Rectangle'},
      {'label': 'Aviator', 'value': 'Aviator'},
      {'label': 'Geometric', 'value': 'Geometric'},
    ];

    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 450),
          child: Container(
            padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top drag handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.muted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              // Header Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.white, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // Grid of 4 shapes
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                  childAspectRatio: 1.25,
                ),
                itemCount: shapes.length,
                itemBuilder: (context, idx) {
                  final shape = shapes[idx];
                  return GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductsScreen(
                            category: category,
                            shape: shape['value'],
                            gender: gender,
                          ),
                        ),
                      );
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border, width: 1.2),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Vector illustration using FrameShapePainter
                          SizedBox(
                            width: 80,
                            height: 44,
                            child: CustomPaint(
                              painter: FrameShapePainter(
                                shape: shape['value']!,
                                strokeColor: AppColors.white,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            shape['label']!,
                            style: const TextStyle(
                              color: AppColors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),
              // View All Shapes button
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProductsScreen(category: category),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.card,
                  foregroundColor: AppColors.white,
                  side: const BorderSide(color: AppColors.border, width: 1.2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text(
                  'View All Shapes',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
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

class FrameShapePainter extends CustomPainter {
  final String shape;
  final Color strokeColor;

  FrameShapePainter({required this.shape, this.strokeColor = Colors.white});

  @override
  void paint(Canvas canvas, Size size) {
    final framePaint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final lensPaint = Paint()
      ..color = strokeColor.withAlpha(89)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8
      ..strokeCap = StrokeCap.round;

    final detailPaint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final w = size.width;
    final h = size.height;
    
    final centerX = w / 2;
    final centerY = h / 2;

    double lensW = 24;
    double lensH = 18;
    double gap = 10; 

    if (shape.toLowerCase() == 'square') {
      lensW = 22;
      lensH = 20;
      gap = 10;
      
      final leftRect = Rect.fromLTWH(centerX - gap / 2 - lensW, centerY - lensH / 2, lensW, lensH);
      final rightRect = Rect.fromLTWH(centerX + gap / 2, centerY - lensH / 2, lensW, lensH);
      
      canvas.drawRRect(RRect.fromRectAndRadius(leftRect, const Radius.circular(5)), framePaint);
      canvas.drawRRect(RRect.fromRectAndRadius(rightRect, const Radius.circular(5)), framePaint);
      
      canvas.drawRRect(RRect.fromRectAndRadius(leftRect.deflate(1.5), const Radius.circular(4)), lensPaint);
      canvas.drawRRect(RRect.fromRectAndRadius(rightRect.deflate(1.5), const Radius.circular(4)), lensPaint);
      
      final bridgePath = Path()
        ..moveTo(centerX - gap / 2, centerY - 2)
        ..quadraticBezierTo(centerX, centerY - 5, centerX + gap / 2, centerY - 2);
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(Offset(centerX - gap / 2 - lensW, centerY - 4), Offset(centerX - gap / 2 - lensW - 6, centerY - 3), detailPaint);
      canvas.drawLine(Offset(centerX - gap / 2 - lensW - 6, centerY - 3), Offset(centerX - gap / 2 - lensW - 9, centerY + 3), detailPaint);

      canvas.drawLine(Offset(centerX + gap / 2 + lensW, centerY - 4), Offset(centerX + gap / 2 + lensW + 6, centerY - 3), detailPaint);
      canvas.drawLine(Offset(centerX + gap / 2 + lensW + 6, centerY - 3), Offset(centerX + gap / 2 + lensW + 9, centerY + 3), detailPaint);

    } else if (shape.toLowerCase() == 'rectangle') {
      lensW = 26;
      lensH = 15;
      gap = 8;

      final leftRect = Rect.fromLTWH(centerX - gap / 2 - lensW, centerY - lensH / 2, lensW, lensH);
      final rightRect = Rect.fromLTWH(centerX + gap / 2, centerY - lensH / 2, lensW, lensH);

      canvas.drawRRect(RRect.fromRectAndRadius(leftRect, const Radius.circular(4)), framePaint);
      canvas.drawRRect(RRect.fromRectAndRadius(rightRect, const Radius.circular(4)), framePaint);

      canvas.drawRRect(RRect.fromRectAndRadius(leftRect.deflate(1.5), const Radius.circular(3)), lensPaint);
      canvas.drawRRect(RRect.fromRectAndRadius(rightRect.deflate(1.5), const Radius.circular(3)), lensPaint);

      final bridgePath = Path()
        ..moveTo(centerX - gap / 2, centerY - 1)
        ..quadraticBezierTo(centerX, centerY - 4, centerX + gap / 2, centerY - 1);
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(Offset(centerX - gap / 2 - lensW, centerY - 3), Offset(centerX - gap / 2 - lensW - 6, centerY - 2), detailPaint);
      canvas.drawLine(Offset(centerX - gap / 2 - lensW - 6, centerY - 2), Offset(centerX - gap / 2 - lensW - 9, centerY + 3), detailPaint);

      canvas.drawLine(Offset(centerX + gap / 2 + lensW, centerY - 3), Offset(centerX + gap / 2 + lensW + 6, centerY - 2), detailPaint);
      canvas.drawLine(Offset(centerX + gap / 2 + lensW + 6, centerY - 2), Offset(centerX + gap / 2 + lensW + 9, centerY + 3), detailPaint);

    } else if (shape.toLowerCase() == 'aviator') {
      lensW = 24;
      lensH = 20;
      gap = 10;

      Path getTeardropPath(double startX, bool isLeft) {
        final path = Path();
        final double l = startX;
        final double r = startX + lensW;
        final double t = centerY - lensH / 2;
        final double b = centerY + lensH / 2;

        if (isLeft) {
          path.moveTo(l + 4, t);
          path.lineTo(r - 3, t);
          path.quadraticBezierTo(r, t, r, t + 3);
          path.lineTo(r - 1, t + 12);
          path.cubicTo(r - 3, b - 2, l + 5, b + 2, l, b - 6);
          path.lineTo(l, t + 3);
          path.quadraticBezierTo(l, t, l + 4, t);
        } else {
          path.moveTo(r - 4, t);
          path.lineTo(l + 3, t);
          path.quadraticBezierTo(l, t, l, t + 3);
          path.lineTo(l + 1, t + 12);
          path.cubicTo(l + 3, b - 2, r - 5, b + 2, r, b - 6);
          path.lineTo(r, t + 3);
          path.quadraticBezierTo(r, t, r - 4, t);
        }
        return path;
      }

      final leftPathOuter = getTeardropPath(centerX - gap / 2 - lensW, true);
      final rightPathOuter = getTeardropPath(centerX + gap / 2, false);

      canvas.drawPath(leftPathOuter, framePaint);
      canvas.drawPath(rightPathOuter, framePaint);

      Path getTeardropPathInner(double startX, bool isLeft) {
        final path = Path();
        final double l = startX + (isLeft ? 1.5 : 0.8);
        final double r = startX + lensW - (isLeft ? 0.8 : 1.5);
        final double t = centerY - lensH / 2 + 1.5;
        final double b = centerY + lensH / 2 - 1.5;

        if (isLeft) {
          path.moveTo(l + 3, t);
          path.lineTo(r - 2, t);
          path.quadraticBezierTo(r, t, r, t + 2);
          path.lineTo(r - 1, t + 10);
          path.cubicTo(r - 2, b - 2, l + 4, b + 1.5, l, b - 5);
          path.lineTo(l, t + 2);
          path.quadraticBezierTo(l, t, l + 3, t);
        } else {
          path.moveTo(r - 3, t);
          path.lineTo(l + 2, t);
          path.quadraticBezierTo(l, t, l, t + 2);
          path.lineTo(l + 1, t + 10);
          path.cubicTo(l + 2, b - 2, r - 4, b + 1.5, r, b - 5);
          path.lineTo(r, t + 2);
          path.quadraticBezierTo(r, t, r - 3, t);
        }
        return path;
      }

      final leftPathInner = getTeardropPathInner(centerX - gap / 2 - lensW, true);
      final rightPathInner = getTeardropPathInner(centerX + gap / 2, false);
      canvas.drawPath(leftPathInner, lensPaint);
      canvas.drawPath(rightPathInner, lensPaint);

      final double lTop = centerY - lensH / 2;
      final double lRight = centerX - gap / 2;
      final double rLeft = centerX + gap / 2;
      
      canvas.drawLine(Offset(lRight - 1, lTop + 1), Offset(rLeft + 1, lTop + 1), detailPaint);
      
      final bridgePath = Path()
        ..moveTo(lRight, centerY)
        ..quadraticBezierTo(centerX, centerY - 2.5, rLeft, centerY);
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(Offset(lRight - lensW, centerY - 3), Offset(lRight - lensW - 6, centerY - 2), detailPaint);
      canvas.drawLine(Offset(lRight - lensW - 6, centerY - 2), Offset(lRight - lensW - 9, centerY + 3), detailPaint);

      canvas.drawLine(Offset(rLeft + lensW, centerY - 3), Offset(rLeft + lensW + 6, centerY - 2), detailPaint);
      canvas.drawLine(Offset(rLeft + lensW + 6, centerY - 2), Offset(rLeft + lensW + 9, centerY + 3), detailPaint);

    } else if (shape.toLowerCase() == 'geometric') {
      lensW = 24;
      lensH = 20;
      gap = 10;

      Path getHexagonPath(double startX, double inset) {
        final double l = startX + inset;
        final double r = startX + lensW - inset;
        final double t = centerY - lensH / 2 + inset;
        final double b = centerY + lensH / 2 - inset;
        final double midY = centerY;

        return Path()
          ..moveTo(l + 5, t)
          ..lineTo(r - 5, t)
          ..lineTo(r, midY)
          ..lineTo(r - 5, b)
          ..lineTo(l + 5, b)
          ..lineTo(l, midY)
          ..close();
      }

      final leftHexOuter = getHexagonPath(centerX - gap / 2 - lensW, 0);
      final rightHexOuter = getHexagonPath(centerX + gap / 2, 0);

      canvas.drawPath(leftHexOuter, framePaint);
      canvas.drawPath(rightHexOuter, framePaint);

      final leftHexInner = getHexagonPath(centerX - gap / 2 - lensW, 1.5);
      final rightHexInner = getHexagonPath(centerX + gap / 2, 1.5);
      canvas.drawPath(leftHexInner, lensPaint);
      canvas.drawPath(rightHexInner, lensPaint);

      final bridgePath = Path()
        ..moveTo(centerX - gap / 2, centerY - 2)
        ..quadraticBezierTo(centerX, centerY - 5, centerX + gap / 2, centerY - 2);
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(Offset(centerX - gap / 2 - lensW, centerY - 3), Offset(centerX - gap / 2 - lensW - 6, centerY - 2), detailPaint);
      canvas.drawLine(Offset(centerX - gap / 2 - lensW - 6, centerY - 2), Offset(centerX - gap / 2 - lensW - 9, centerY + 3), detailPaint);

      canvas.drawLine(Offset(centerX + gap / 2 + lensW, centerY - 3), Offset(centerX + gap / 2 + lensW + 6, centerY - 2), detailPaint);
      canvas.drawLine(Offset(centerX + gap / 2 + lensW + 6, centerY - 2), Offset(centerX + gap / 2 + lensW + 9, centerY + 3), detailPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
