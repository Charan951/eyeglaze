import 'dart:async';
import 'dart:ui';
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
import '../../core/staff_access.dart';
import '../products/products_screen.dart';
import '../products/product_detail_screen.dart';
import '../products/wishlist_screen.dart';
import '../cart/cart_screen.dart';
import '../orders/orders_screen.dart';
import '../account/account_screen.dart';
import '../account/membership_screen.dart';
import '../../widgets/responsive_container.dart';
import '../../widgets/ai_chat_sheet.dart';

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
    OrdersScreen(isStandalonePage: false),
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
        api
            .getProfile()
            .then((res) async {
              if (res['success'] == true && res['user'] != null) {
                final user = User.fromJson(res['user']);
                if (user.isStaff) {
                  await auth.clearToken();
                  if (mounted) {
                    await showStaffUseWebAppDialog(context, role: user.role);
                  }
                  return;
                }
                auth.setUser(user);
              }
            })
            .catchError((_) {});
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

  void _openMembershipPage(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const MembershipScreen()),
    );
  }

  // Floating pill nav bar: the active tab gets a filled gold capsule with its
  // icon + label side-by-side; inactive tabs stay icon-above-label in muted
  // gray, all inside one rounded capsule-shaped bar — same palette as the
  // rest of the app (AppColors.gold / card / muted), no new colors introduced.
  Widget _buildCustomBottomBar() {
    final cartCount = context.watch<CartProvider>().itemCount;
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: ColoredBox(
          color: AppColors.background.withValues(alpha: 0.94),
          child: Padding(
            padding: EdgeInsets.fromLTRB(16, 10, 16, bottomInset > 0 ? bottomInset : 10),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildPillTabItem(
                      index: 0,
                      icon: Icons.home_outlined,
                      activeIcon: Icons.home,
                      label: 'Home',
                    ),
                  ),
                  Expanded(
                    child: _buildPillTabItem(
                      index: 1,
                      icon: Icons.favorite_border,
                      activeIcon: Icons.favorite,
                      label: 'Wishlist',
                    ),
                  ),
                  Expanded(
                    child: _buildPillTabItem(
                      index: 2,
                      icon: Icons.shopping_bag_outlined,
                      activeIcon: Icons.shopping_bag,
                      label: 'Orders',
                    ),
                  ),
                  Expanded(
                    child: _buildPillTabItem(
                      index: 3,
                      icon: Icons.shopping_cart_outlined,
                      activeIcon: Icons.shopping_cart,
                      label: 'Cart',
                      badgeCount: cartCount,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const CartScreen()),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPillTabItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    int badgeCount = 0,
    VoidCallback? onTap,
  }) {
    final isActive = _currentTab == index;
    final mutedColor = AppColors.muted;

    final iconWidget = Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(
          isActive ? activeIcon : icon,
          color: isActive ? Colors.black : mutedColor,
          size: 18,
        ),
        if (badgeCount > 0)
          Positioned(
            right: -6,
            top: -5,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: isActive ? Colors.black : AppColors.gold,
                shape: BoxShape.circle,
                border: isActive ? null : Border.all(color: AppColors.card, width: 1.5),
              ),
              constraints: const BoxConstraints(minWidth: 13, minHeight: 13),
              child: Center(
                child: Text(
                  '$badgeCount',
                  style: TextStyle(
                    color: isActive ? AppColors.gold : Colors.black,
                    fontSize: 7,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
      ],
    );

    return GestureDetector(
      onTap: onTap ??
          () {
            setState(() {
              _currentTab = index;
            });
          },
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isActive ? AppColors.gold : Colors.transparent,
                borderRadius: BorderRadius.circular(999),
              ),
              child: isActive
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        iconWidget,
                        const SizedBox(width: 5),
                        Text(
                          label,
                          maxLines: 1,
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    )
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        iconWidget,
                        const SizedBox(height: 3),
                        Text(
                          label,
                          style: TextStyle(
                            color: mutedColor,
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      extendBody: true,
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
                    child: const Icon(
                      Icons.person_outline,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              );
            } else {
              return IconButton(
                icon: const Icon(Icons.menu, color: AppColors.white),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AccountScreen()),
                ),
              );
            }
          },
        ),
        title: const EyeGlazeLogo(),
        centerTitle: true,
        actions: [
          Consumer<AuthService>(
            builder: (context, auth, _) {
              if (auth.currentUser?.membershipActive == true) {
                return const SizedBox.shrink();
              }
              return GestureDetector(
                onTap: () => _openMembershipPage(context),
                child: Container(
                  margin: const EdgeInsets.only(right: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.verified_outlined, color: AppColors.gold, size: 12),
                      SizedBox(width: 4),
                      Text(
                        'GOLD',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.notifications_outlined,
                  color: AppColors.white,
                ),
                onPressed: () {},
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: const BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      '3',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      // Bottom nav stays visible at all times — no more hide-on-scroll-down.
      body: ResponsiveContainer(maxWidth: 600, child: _tabs[_currentTab]),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.card,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
          side: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => const AiChatSheet(),
          );
        },
        child: const Icon(
          Icons.smart_toy_outlined,
          color: AppColors.gold,
          size: 24,
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
          _HeroBannerSlider(),
          _OfferCoupons(),
          _CategoryGrids(),
          _FeaturedProducts(),
          _PromoBanners(),
          SizedBox(height: 120),
        ],
      ),
    );
  }
}

class _HeroBannerSlider extends StatefulWidget {
  const _HeroBannerSlider();

  @override
  State<_HeroBannerSlider> createState() => _HeroBannerSliderState();
}

class _HeroBannerSliderState extends State<_HeroBannerSlider> {
  final PageController _pageController = PageController();
  int _activeSlide = 0;
  Timer? _timer;
  List<Map<String, String>> _banners = [];

  final List<Map<String, String>> _defaultBanners = const [
    {
      'title': 'SUMMER EYEWEAR SALE',
      'subtitle': 'Flat 50% OFF on Premium Frames & Sunglasses',
      'tag': 'SEASONAL SALE',
      'btn': 'SHOP SALE',
      'image': '/images/sale_eyeglasses.png',
      'target': 'sunglasses',
    },
    {
      'title': 'GOLD MEMBERSHIP',
      'subtitle': 'Buy 1 Get 1 Free on All Frames for 1 Year',
      'tag': 'EXCLUSIVE',
      'btn': 'EXPLORE GOLD',
      'image': '/images/hero_model.png',
      'target': 'gold',
    },
    {
      'title': 'BLUE LIGHT SHIELD',
      'subtitle': 'Protect Your Eyes with Zero-Power Anti-Glare Lenses',
      'tag': 'DIGITAL CARE',
      'btn': 'EXPLORE NOW',
      'image': '/images/cat_blue_light.png',
      'target': 'blue_light',
    },
    {
      'title': 'NEW ARRIVALS',
      'subtitle': 'Discover the Latest Trendsetting Eyewear',
      'tag': '2026 COLLECTION',
      'btn': 'VIEW ALL',
      'image': '/images/promo_new_arrivals.png',
      'target': 'all',
    },
  ];

  @override
  void initState() {
    super.initState();
    _banners = List.from(_defaultBanners);
    _loadBanners();
    _startTimer();
  }

  // Mirrors the web app's top/hero banner filter (frontend Landing.tsx):
  // positions 'hero', 'top', 'eyeglasses_landing', 'both', or no position at
  // all are shown here; banners explicitly marked showOnMobile: false are
  // skipped.
  static const _acceptedPositions = {
    'hero',
    'top',
    'eyeglasses_landing',
    'both',
  };

  /// Extracts a bare category slug (or 'gold'/'all') from a web-style
  /// `linkUrl` such as `/products?category=sunglasses` or `/membership`, so
  /// it can be handed to `_handleBannerTap`.
  String _targetFromLinkUrl(String linkUrl) {
    if (linkUrl.isEmpty) return 'all';
    final lower = linkUrl.toLowerCase();
    if (lower.contains('membership') || lower.contains('gold')) return 'gold';
    final category = Uri.tryParse(linkUrl)?.queryParameters['category'];
    if (category != null && category.isNotEmpty) return category;
    return 'all';
  }

  Future<void> _loadBanners() async {
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final list = await api.getBanners();
      final visible = list.where((b) {
        final position = (b['position'] ?? '').toString();
        final showOnMobile = b['showOnMobile'];
        if (showOnMobile == false) return false;
        return position.isEmpty || _acceptedPositions.contains(position);
      }).toList();
      if (visible.isNotEmpty && mounted) {
        final fetched = visible
            .map<Map<String, String>>(
              (b) => {
                'title': (b['title'] ?? 'EYEGLAZE').toString(),
                'subtitle':
                    (b['subtitle'] ?? b['description'] ?? 'Special Offer')
                        .toString(),
                'tag': (b['tag'] ?? 'PROMOTION').toString().toUpperCase(),
                'btn': (b['buttonText'] ?? 'EXPLORE NOW')
                    .toString()
                    .toUpperCase(),
                'image': (b['imageUrl'] ?? '/images/hero_model.png').toString(),
                'target': _targetFromLinkUrl((b['linkUrl'] ?? '').toString()),
              },
            )
            .toList();
        setState(() {
          _banners = fetched;
        });
      }
    } catch (_) {}
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (mounted && _pageController.hasClients) {
        final next = (_activeSlide + 1) % _banners.length;
        _pageController.animateToPage(
          next,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _handleBannerTap(String target) {
    if (target == 'gold') {
      HomeScreen.state?._openMembershipPage(context);
    } else if (target == 'all') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ProductsScreen()),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ProductsScreen(category: target)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 165,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (idx) => setState(() => _activeSlide = idx),
            itemCount: _banners.length,
            itemBuilder: (context, idx) {
              final item = _banners[idx];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.3),
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: CachedNetworkImage(
                          imageUrl: AppConfig.resolveImageUrl(item['image']!),
                          fit: BoxFit.cover,
                          alignment: Alignment.centerRight,
                          errorWidget: (_, __, ___) =>
                              Container(color: AppColors.card),
                        ),
                      ),
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                              colors: [
                                Colors.black.withValues(alpha: 0.92),
                                Colors.black.withValues(alpha: 0.75),
                                Colors.black.withValues(alpha: 0.2),
                              ],
                              stops: const [0.0, 0.55, 1.0],
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppColors.gold.withValues(alpha: 0.5),
                                ),
                              ),
                              child: Text(
                                item['tag']!,
                                style: const TextStyle(
                                  color: AppColors.gold,
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              item['title']!,
                              style: const TextStyle(
                                color: AppColors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 3),
                            SizedBox(
                              width: 200,
                              child: Text(
                                item['subtitle']!,
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 10,
                                  height: 1.2,
                                ),
                                maxLines: 2,
                              ),
                            ),
                            const SizedBox(height: 10),
                            GestureDetector(
                              onTap: () => _handleBannerTap(item['target']!),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.gold,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'EXPLORE NOW',
                                      style: TextStyle(
                                        color: Colors.black,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    SizedBox(width: 4),
                                    Icon(
                                      Icons.arrow_forward_rounded,
                                      color: Colors.black,
                                      size: 12,
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
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _banners.length,
            (idx) => AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _activeSlide == idx ? 14 : 5,
              height: 5,
              decoration: BoxDecoration(
                color: _activeSlide == idx
                    ? AppColors.gold
                    : AppColors.muted.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
      ],
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
              const Icon(Icons.waving_hand, color: AppColors.gold, size: 20),
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
    if (c.contains('welcome') ||
        c.contains('new') ||
        n.contains('welcome') ||
        n.contains('new')) {
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
    final name = (coupon['name'] ?? 'DISCOUNT VOUCHER')
        .toString()
        .toUpperCase();
    final description =
        coupon['description'] ??
        'Apply this promo code at checkout to claim your deal.';
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
                errorWidget: (context, url, error) =>
                    Container(color: const Color(0xFF151515)),
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
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.15),
                          border: Border.all(
                            color: AppColors.gold.withValues(alpha: 0.4),
                          ),
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
                        Shadow(
                          color: Colors.black54,
                          offset: Offset(0, 1),
                          blurRadius: 2,
                        ),
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
                        Shadow(
                          color: Colors.black54,
                          offset: Offset(0, 1),
                          blurRadius: 1,
                        ),
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
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFF0B0B0C,
                            ).withValues(alpha: 0.8),
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
                              content: Text(
                                'Coupon code "$code" copied to clipboard!',
                              ),
                              backgroundColor: AppColors.success,
                              duration: const Duration(seconds: 1),
                            ),
                          );
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isCopied
                                ? AppColors.success
                                : AppColors.gold,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color:
                                    (isCopied
                                            ? AppColors.success
                                            : AppColors.gold)
                                        .withValues(alpha: 0.3),
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
                  color: _activeSlide == idx
                      ? AppColors.gold
                      : AppColors.muted.withValues(alpha: 0.4),
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
  final bool isCircle;
  final double imageAspectRatio;

  const _CategoryCard({
    required this.label,
    required this.imagePath,
    required this.onTap,
    this.isCircle = false,
    this.imageAspectRatio = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    final borderRadius = isCircle
        ? BorderRadius.circular(9999)
        : BorderRadius.circular(12);
    // Image on top, label + "Shop Now" below it — matches the web app's
    // mobile category grid (Landing.tsx: image div, then a separate <span>
    // underneath), instead of overlaying the text on the image with a
    // gradient scrim.
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AspectRatio(
            aspectRatio: imageAspectRatio,
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: borderRadius,
                border: Border.all(color: AppColors.border),
              ),
              child: ClipRRect(
                borderRadius: borderRadius,
                child: CachedNetworkImage(
                  imageUrl: AppConfig.resolveImageUrl(imagePath),
                  fit: BoxFit.cover,
                  alignment: Alignment.topCenter,
                  errorWidget: (context, url, error) => const Center(
                    child: Icon(
                      Icons.broken_image_outlined,
                      color: AppColors.muted,
                      size: 24,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 8.5,
              fontWeight: FontWeight.w900,
              height: 1.15,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
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

  // Banners positioned 'after_category:<slug>' in admin, keyed by slug —
  // rendered right after that category's grid, matching the web app's
  // placement (Landing.tsx `categoryBanners`).
  static const _afterCategoryPrefix = 'after_category:';
  Map<String, List<Map<String, dynamic>>> _categoryBannersMap = {};

  // Admin-managed shapes (each with its own uploaded image) — powers the
  // shape-selection bottom sheet, matching the web app (Landing.tsx dbShapes).
  List<dynamic> _dbShapes = [];

  final List<dynamic> _fallbackCategories = [
    {'name': 'Prescription', 'code': 'prescription', 'slug': 'prescription'},
    {'name': 'Sunglasses', 'code': 'sunglasses', 'slug': 'sunglasses'},
    {
      'name': 'Reading Glasses',
      'code': 'reading-glasses',
      'slug': 'reading-glasses',
    },
    {
      'name': 'Contact Lenses',
      'code': 'contact-lenses',
      'slug': 'contact-lenses',
    },
    {'name': 'Accessories', 'code': 'accessories', 'slug': 'accessories'},
    {'name': 'Kids', 'code': 'kids', 'slug': 'kids'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadCategoryBanners();
    _loadShapes();

    // Connect socket listeners
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final socketService = context.read<SocketService>();
        socketService.socket?.on('category_changed', _onCategoryChanged);
        socketService.socket?.on('banner_changed', _onBannerChanged);
      }
    });
  }

  @override
  void dispose() {
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('category_changed', _onCategoryChanged);
      socketService.socket?.off('banner_changed', _onBannerChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onCategoryChanged(dynamic data) {
    if (kDebugMode) {
      print(
        'Socket: category_changed event received on home category grids: $data',
      );
    }
    if (mounted) {
      _loadCategories();
    }
  }

  void _onBannerChanged(dynamic data) {
    if (mounted) {
      _loadCategoryBanners();
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

  Future<void> _loadCategoryBanners() async {
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final list = await api.getBanners();
      final map = <String, List<Map<String, dynamic>>>{};
      for (final b in list) {
        final position = (b['position'] ?? '').toString();
        final showOnMobile = b['showOnMobile'];
        if (showOnMobile == false) continue;
        if (!position.startsWith(_afterCategoryPrefix)) continue;
        final slug = position.substring(_afterCategoryPrefix.length);
        if (slug.isEmpty) continue;
        map.putIfAbsent(slug, () => []).add((b as Map).cast<String, dynamic>());
      }
      if (mounted) setState(() => _categoryBannersMap = map);
    } catch (_) {}
  }

  Future<void> _loadShapes() async {
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final list = await api.getShapes();
      if (mounted) setState(() => _dbShapes = list);
    } catch (_) {}
  }

  void _showShapeSelectionSheet(
    BuildContext context, {
    required String title,
    required String category,
    String? subCategory,
    String? subCategoryLabel,
    String? gender,
    List<String>? modalShapes,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return _ShapeSelectionSheet(
          title: title,
          category: category,
          subCategory: subCategory,
          subCategoryLabel: subCategoryLabel,
          gender: gender,
          modalShapes: modalShapes,
          dbShapes: _dbShapes,
        );
      },
    );
  }

  void _showSubSubCategorySelectionSheet(
    BuildContext context, {
    required String title,
    required String category,
    String? subCategory,
    String? subCategoryLabel,
    required List<Map<String, String>> items,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return _SubSubCategorySelectionSheet(
          title: title,
          category: category,
          subCategory: subCategory,
          subCategoryLabel: subCategoryLabel,
          items: items,
        );
      },
    );
  }

  // Mirrors web's Landing.tsx: (sub.children || []).filter(child =>
  // !sub.modalSubSubCategories?.length || sub.modalSubSubCategories.includes(child.slug))
  // The categories API returns image fields as '' (not omitted) whenever the
  // admin hasn't enabled that image, so a plain `??` fallback chain (which
  // only skips actual nulls) leaves an empty string in place instead of
  // falling through — matching JS's `||` fallback used on the web app.
  static String _firstNonEmpty(List<String> candidates) {
    for (final c in candidates) {
      if (c.isNotEmpty) return c;
    }
    return '';
  }

  List<Map<String, String>> _filterSubSubCategories(dynamic sub) {
    final children = (sub['children'] as List?) ?? const [];
    final allowedSlugs = (sub['modalSubSubCategories'] as List?)
            ?.map((e) => e.toString())
            .toList() ??
        const <String>[];
    return children
        .where((child) =>
            allowedSlugs.isEmpty ||
            allowedSlugs.contains((child['slug'] ?? '').toString()))
        .map<Map<String, String>>((child) => {
              'name': (child['name'] ?? '').toString(),
              'slug': (child['slug'] ?? '').toString(),
              'imagePath': _firstNonEmpty([
                (child['bannerImage'] ?? '').toString(),
                (child['icon'] ?? '').toString(),
                '/images/hero_model.png',
              ]),
            })
        .toList();
  }

  List<Map<String, dynamic>> _getCategorySubOptions(dynamic cat) {
    if (cat['children'] != null && (cat['children'] as List).isNotEmpty) {
      final childrenList = List<dynamic>.from(cat['children']);
      childrenList.sort(
        (a, b) => ((a['displayOrder'] ?? 0) as num).compareTo(
          (b['displayOrder'] ?? 0) as num,
        ),
      );
      return childrenList
          .map<Map<String, dynamic>>(
            (sub) => {
              'label': (sub['name'] ?? '').toString(),
              // Same empty-string-vs-null fallback issue as _filterSubSubCategories
              // above: the API returns bannerImage as '' (not omitted) whenever
              // it isn't enabled in admin, so that must fall through too.
              'imagePath': _firstNonEmpty([
                (sub['bannerImage'] ?? '').toString(),
                (sub['icon'] ?? '').toString(),
                '/images/hero_model.png',
              ]),
              'category': cat['slug']?.toString() ?? '',
              'gender': sub['gender']?.toString(),
              'shapeModal': sub['shapeModal'] == true,
              'subCategorySlug': sub['slug']?.toString(),
              // The subcategory's own "Shapes to display in modal" list (set on
              // Categories → edit SubCategory) — scopes the shape picker sheet to
              // just what's relevant here, matching the web app (Landing.tsx
              // handleSubOptionClick: setShapeModalShapes(option.modalShapes || ...)).
              'modalShapes': (sub['modalShapes'] as List?)
                      ?.map((e) => e.toString())
                      .toList() ??
                  const <String>[],
              // "Show sub-categories in bottom sheet on click" (admin) — when
              // enabled, tapping this subcategory opens a bottom sheet listing
              // its own children instead of the shape selector or a direct
              // link, scoped to "Sub-Categories to display in bottom sheet"
              // when set. Matches the web app (Landing.tsx getCategorySubOptions).
              'subSubCategoryModal': sub['subSubCategoryModal'] == true,
              'subSubCategories': _filterSubSubCategories(sub),
            },
          )
          .toList();
    }

    final slug = (cat['slug'] ?? '').toString().toLowerCase();

    if (slug == 'eyeglasses' || slug == 'prescription') {
      return [
        {
          'label': 'Men',
          'imagePath': '/images/men_eyeglasses.png',
          'category': cat['slug'],
          'gender': 'men',
          'shapeModal': true,
        },
        {
          'label': 'Women',
          'imagePath': '/images/women_eyeglasses.png',
          'category': cat['slug'],
          'gender': 'women',
          'shapeModal': true,
        },
        {
          'label': 'Kids',
          'imagePath': '/images/kids_eyeglasses.png',
          'category': cat['slug'],
          'gender': 'kids',
          'shapeModal': true,
        },
        {
          'label': 'Contact Lens',
          'imagePath': '/images/cat_contacts.png',
          'category': 'contact-lenses',
          'shapeModal': false,
        },
      ];
    }

    if (slug == 'sunglasses') {
      return [
        {
          'label': 'Men',
          'imagePath': '/images/men_sunglasses.png',
          'category': cat['slug'],
          'gender': 'men',
          'shapeModal': true,
        },
        {
          'label': 'Women',
          'imagePath': '/images/women_sunglasses.png',
          'category': cat['slug'],
          'gender': 'women',
          'shapeModal': true,
        },
        {
          'label': 'Kids',
          'imagePath': '/images/kids_sunglasses.png',
          'category': cat['slug'],
          'gender': 'kids',
          'shapeModal': true,
        },
        {
          'label': 'Accessories',
          'imagePath': '/images/accessories.png',
          'category': 'accessories',
          'shapeModal': false,
        },
      ];
    }

    if (slug == 'reading-glasses' || slug == 'special-power') {
      return [
        {
          'label': 'Zero Power',
          'imagePath': '/images/zero_power_glasses.png',
          'category': 'zero-power',
          'shapeModal': true,
        },
        {
          'label': 'Reading',
          'imagePath': '/images/reading_book.png',
          'category': cat['slug'],
          'shapeModal': true,
        },
        {
          'label': 'Power Sun',
          'imagePath': '/images/transition_lens.png',
          'category': 'sunglasses',
          'shapeModal': true,
        },
      ];
    }

    if (slug == 'contact-lenses') {
      return [
        {
          'label': 'Clear Lenses',
          'imagePath': '/images/cat_contacts.png',
          'category': cat['slug'],
          'shapeModal': false,
        },
        {
          'label': 'Color Lenses',
          'imagePath': '/images/cat_contacts.png',
          'category': cat['slug'],
          'shapeModal': false,
        },
        {
          'label': 'Solutions',
          'imagePath': '/images/accessories.png',
          'category': cat['slug'],
          'shapeModal': false,
        },
        {
          'label': 'View More',
          'imagePath': cat['bannerImage'] ?? '/images/cat_contacts.png',
          'category': cat['slug'],
          'shapeModal': false,
        },
      ];
    }

    // Default generic sub-options for any dynamic category
    return [
      {
        'label': 'Men',
        'imagePath': '/images/men_eyeglasses.png',
        'category': cat['slug'],
        'gender': 'men',
        'shapeModal': true,
      },
      {
        'label': 'Women',
        'imagePath': '/images/women_eyeglasses.png',
        'category': cat['slug'],
        'gender': 'women',
        'shapeModal': true,
      },
      {
        'label': 'Kids',
        'imagePath': '/images/kids_eyeglasses.png',
        'category': cat['slug'],
        'gender': 'kids',
        'shapeModal': true,
      },
      {
        'label': 'View More',
        'imagePath': cat['bannerImage'] ?? '/images/hero_model.png',
        'category': cat['slug'],
        'shapeModal': false,
      },
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
      (c) => c['slug'] == 'reading-glasses' || c['slug'] == 'special-power',
      orElse: () => null,
    );

    final knownSlugs = [
      'prescription',
      'eyeglasses',
      'sunglasses',
      'reading-glasses',
      'special-power',
      'contact-lenses',
      'accessories',
      'kids',
    ];
    final dynamicCats = _categoriesList
        .where((c) => !knownSlugs.contains(c['slug']?.toString().toLowerCase()))
        .toList();

    // Adds a category's grid, then — if admin has set one up — the
    // 'after_category:<slug>' banner(s) right below it, matching the web
    // app's placement and spacing exactly (Landing.tsx `categoryBanners`
    // uses `mt-2 mb-1` around the banner, i.e. 8px above / 4px below).
    void addCategorySection(dynamic cat) {
      sections.add(_buildSection(cat));
      final slug = (cat['slug'] ?? '').toString();
      final banners = _categoryBannersMap[slug];
      if (banners != null && banners.isNotEmpty) {
        for (final banner in banners) {
          sections.add(const SizedBox(height: 8));
          sections.add(_CmsBannerCard(banner: banner, width: double.infinity));
        }
        sections.add(const SizedBox(height: 4));
      } else {
        sections.add(const SizedBox(height: 16));
      }
    }

    if (eyeglassesCat != null) addCategorySection(eyeglassesCat);
    if (sunglassesCat != null) addCategorySection(sunglassesCat);
    if (readingCat != null) addCategorySection(readingCat);

    for (final dynamicCat in dynamicCats) {
      addCategorySection(dynamicCat);
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
    final slug = (cat['slug'] ?? '').toString().toLowerCase();
    String title = (cat['name'] ?? cat['code'] ?? '').toString().toUpperCase();
    if (slug == 'reading-glasses' || slug == 'special-power') {
      title = 'SPECIAL POWER';
    }

    // Layout is admin-configurable (Category edit form → "Sub-Category
    // Layout Design"): shape ('circle' | 'square' | 'rectangle', default
    // 'square'), and grid column count. Mirrors the web app's handling
    // (Landing.tsx) so mobile matches whatever admin picks.
    final shape = (cat['subCategoryShape'] ?? '').toString();
    final configuredColumns = cat['subCategoryColumns'] is num
        ? (cat['subCategoryColumns'] as num).toInt()
        : null;
    final crossCount = configuredColumns ?? (subOptions.length == 3 ? 3 : 4);
    final aspect = shape == 'rectangle' ? 4 / 3 : 1.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: AppColors.white,
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        // GridView.count's own shrinkWrap self-measurement over-reports its height
        // in this Flutter build (verified: it renders correctly and needs far less
        // space than it claims), leaving a large blank gap below every category row.
        // Compute the true grid height ourselves from the same formula Flutter's
        // SliverGridDelegateWithFixedCrossAxisCount uses, and force it via SizedBox
        // so the Column doesn't inherit the inflated size.
        LayoutBuilder(
          builder: (context, constraints) {
            const crossAxisSpacing = 8.0;
            const mainAxisSpacing = 8.0;
            // The label now renders below the image (matching the web app)
            // instead of overlaid on it, so each grid cell needs extra height
            // beyond the image's own aspect ratio to fit that text.
            const textAreaHeight = 26.0;
            final cellWidth = (constraints.maxWidth - crossAxisSpacing * (crossCount - 1)) / crossCount;
            final imageHeight = cellWidth / aspect;
            final cellHeight = imageHeight + textAreaHeight;
            final rows = (subOptions.length / crossCount).ceil();
            final gridHeight = rows <= 0 ? 0.0 : rows * cellHeight + (rows - 1) * mainAxisSpacing;

            return SizedBox(
              height: gridHeight,
              child: GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: crossCount,
                crossAxisSpacing: crossAxisSpacing,
                mainAxisSpacing: mainAxisSpacing,
                childAspectRatio: cellWidth / cellHeight,
                children: subOptions.map((opt) {
                  return _CategoryCard(
                    label: opt['label'],
                    imagePath: opt['imagePath'],
                    isCircle: shape == 'circle',
                    imageAspectRatio: aspect,
                    onTap: () {
                      final subSubCategories =
                          (opt['subSubCategories'] as List?) ?? const [];
                      // Priority order matches web (Landing.tsx handleSubOptionClick):
                      // 1) subSubCategoryModal bottom sheet, 2) shape picker, 3) direct navigate.
                      if (opt['subSubCategoryModal'] == true &&
                          subSubCategories.isNotEmpty) {
                        _showSubSubCategorySelectionSheet(
                          context,
                          title: "${opt['label']}'s ${cat['name'] ?? ''}",
                          category: opt['category'],
                          subCategory: opt['subCategorySlug'],
                          subCategoryLabel: opt['label']?.toString(),
                          items: subSubCategories.cast<Map<String, String>>(),
                        );
                      } else if (opt['shapeModal'] == true) {
                        final isKids =
                            opt['gender'] == 'kids' ||
                            opt['label'].toString().toLowerCase() == 'kids';
                        _showShapeSelectionSheet(
                          context,
                          title: isKids
                              ? 'Select Age Group'
                              : "${opt['label']}'s ${cat['name'] ?? ''}",
                          category: opt['category'],
                          subCategory: opt['subCategorySlug'],
                          subCategoryLabel: opt['label']?.toString(),
                          gender: opt['gender'],
                          modalShapes: (opt['modalShapes'] as List?)
                              ?.cast<String>(),
                        );
                      } else {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ProductsScreen(
                              category: opt['category'],
                              subCategory: opt['subCategorySlug'],
                              gender: opt['gender'],
                              initialTitle: opt['label']?.toString(),
                            ),
                          ),
                        );
                      }
                    },
                  );
                }).toList(),
              ),
            );
          },
        ),
      ],
    );
  }
}

// A single CMS-driven banner card — its own image, title/subtitle, and a
// button that navigates by extracting a category slug (or Gold membership)
// out of the banner's `linkUrl`. Shared by the per-category banner slot
// (`_CategoryGrids`) and the footer promo slot (`_PromoBanners`), matching
// how the web app places each banner by its `position`.
class _CmsBannerCard extends StatelessWidget {
  final Map<String, dynamic> banner;
  final double width;
  const _CmsBannerCard({required this.banner, this.width = 260});

  void _handleTap(BuildContext context) {
    final linkUrl = (banner['linkUrl'] ?? '').toString();
    final lower = linkUrl.toLowerCase();
    if (lower.contains('membership') || lower.contains('gold')) {
      HomeScreen.state?._openMembershipPage(context);
      return;
    }
    final category = Uri.tryParse(linkUrl)?.queryParameters['category'];
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ProductsScreen(category: category)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = (banner['imageUrl'] ?? '').toString();
    final title = (banner['title'] ?? '').toString();
    final subtitle = (banner['subtitle'] ?? banner['description'] ?? '')
        .toString();
    final btn = (banner['buttonText'] ?? 'SHOP NOW').toString().toUpperCase();

    return GestureDetector(
      onTap: () => _handleTap(context),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: width,
          height: 140,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (imageUrl.isNotEmpty)
                CachedNetworkImage(
                  imageUrl: AppConfig.resolveImageUrl(imageUrl),
                  fit: BoxFit.cover,
                )
              else
                Container(color: AppColors.card),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x00000000), Color(0xCC000000)],
                    stops: [0.3, 1.0],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (title.isNotEmpty)
                      Text(
                        title,
                        style: const TextStyle(
                          color: AppColors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    if (subtitle.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2, bottom: 6),
                        child: Text(
                          subtitle,
                          style: const TextStyle(
                            color: AppColors.muted,
                            fontSize: 11,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.gold,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        btn,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
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
}

class _PromoBanners extends StatefulWidget {
  const _PromoBanners();

  @override
  State<_PromoBanners> createState() => _PromoBannersState();
}

class _PromoBannersState extends State<_PromoBanners> {
  // Only the 'footer' position lands here — 'hero'/'top'/'eyeglasses_landing'
  // /'both' go to the top hero slider, and 'after_category:<slug>' banners
  // are rendered inline by `_CategoryGrids`, right after their category.
  // Mirrors the web app's footerBanners placement (Landing.tsx).
  List<Map<String, dynamic>> _cmsBanners = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final list = await api.getBanners();
      final promos = list.where((b) {
        final position = (b['position'] ?? '').toString();
        final showOnMobile = b['showOnMobile'];
        if (showOnMobile == false) return false;
        return position == 'footer';
      }).toList();
      if (mounted && promos.isNotEmpty) {
        setState(() {
          _cmsBanners = promos.cast<Map<String, dynamic>>();
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_cmsBanners.isNotEmpty) {
      return SizedBox(
        height: 140,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: _cmsBanners.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, i) => _CmsBannerCard(banner: _cmsBanners[i]),
        ),
      );
    }

    // Fallback: static promo cards, shown until admin configures banners
    // for this slot (or if the request fails).
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
                  const Text(
                    'UP TO',
                    style: TextStyle(color: AppColors.muted, fontSize: 11),
                  ),
                  const Text(
                    '50% OFF',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'On Selected\nSunglasses',
                    style: TextStyle(color: AppColors.white, fontSize: 11),
                    maxLines: 2,
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            const ProductsScreen(category: 'Sunglasses'),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.gold,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'SHOP NOW',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
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
                  const Text(
                    'NEW',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'ARRIVALS',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Just In! Latest\ntrends in eyewear',
                    style: TextStyle(color: AppColors.muted, fontSize: 11),
                    maxLines: 2,
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProductsScreen()),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.gold),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'EXPLORE',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
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
      print(
        'Socket: product_changed event received on home featured products: $data',
      );
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
                  Text(
                    'EyeGlaze Bestsellers of the week',
                    style: TextStyle(color: AppColors.muted, fontSize: 10),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProductsScreen()),
                ),
                child: const Text('Explore All ›', style: AppTextStyles.gold),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 240,
          child: _loading
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.gold),
                )
              : ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _products.length,
                  itemBuilder: (_, i) => _FeaturedProductCard(
                    product: _products[i],
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            ProductDetailScreen(product: _products[i]),
                      ),
                    ),
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
        ? ((product.originalPrice - product.sellingPrice) /
                  product.originalPrice *
                  100)
              .round()
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
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                    ),
                    width: double.infinity,
                    height: double.infinity,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                      child: product.images.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: AppConfig.resolveImageUrl(
                                product.images.first,
                              ),
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: AppColors.gold,
                                    strokeWidth: 2,
                                  ),
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
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.gold,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'BESTSELLER',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, color: AppColors.gold, size: 10),
                      const SizedBox(width: 2),
                      Text(
                        '${product.rating}',
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '(${product.reviewCount})',
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 9,
                        ),
                      ),
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
                          Text(
                            '₹${product.sellingPrice.toInt()}',
                            style: const TextStyle(
                              color: AppColors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '₹${product.originalPrice.toInt()}',
                            style: const TextStyle(
                              color: AppColors.muted,
                              decoration: TextDecoration.lineThrough,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                      if (discount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.gold.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '$discount%',
                            style: const TextStyle(
                              color: AppColors.gold,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
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
                      const Text(
                        'EYEGLAZE WALLET',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Manage Balance & Cashback',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 8,
                        ),
                      ),
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
                const Text(
                  'AVAILABLE BALANCE',
                  style: TextStyle(
                    color: AppColors.muted,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${user != null ? user.walletBalance.toStringAsFixed(2) : "0.00"}',
                  style: TextStyle(
                    color: AppColors.gold,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  '✓ 100% usable on next order',
                  style: TextStyle(
                    color: Colors.green,
                    fontSize: 8.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Recent Activity
          const Text(
            'RECENT ACTIVITY',
            style: TextStyle(
              color: AppColors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child:
                user != null &&
                    user.transactions != null &&
                    user.transactions!.isNotEmpty
                ? ListView.builder(
                    itemCount: user.transactions!.length,
                    itemBuilder: (context, i) {
                      final tx =
                          user.transactions![user.transactions!.length - 1 - i];
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
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  tx['date'] != null
                                      ? DateTime.parse(
                                          tx['date'],
                                        ).toLocal().toString().split(' ')[0]
                                      : 'Recent',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.3),
                                    fontSize: 8,
                                  ),
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
                      _buildMockTxTile(
                        'Sign-up Bonus Credit',
                        'Jun 18, 2026',
                        '+₹100',
                        Colors.green,
                      ),
                      _buildMockTxTile(
                        'Referral Cashback Reward',
                        'Jun 15, 2026',
                        '+₹400',
                        Colors.green,
                      ),
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
                        title: const Text(
                          'Invite Friends',
                          style: TextStyle(color: Colors.white),
                        ),
                        content: const Text(
                          'Referrals are credited instantly! Share link with friends:\nhttps://web.eyeglaze.in/invite',
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 13,
                          ),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text(
                              'OK',
                              style: TextStyle(color: AppColors.gold),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.border),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'REFER & EARN',
                    style: TextStyle(fontSize: 10),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gold,
                  ),
                  child: const Text(
                    'CLOSE',
                    style: TextStyle(fontSize: 10, color: Colors.black),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMockTxTile(
    String title,
    String date,
    String amount,
    Color color,
  ) {
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
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  date,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                    fontSize: 8,
                  ),
                ),
              ],
            ),
            Text(
              amount,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Sub-sub-category picker bottom sheet — shown when a subcategory has "Show
// sub-categories in bottom sheet on click" enabled in admin. Mirrors the web
// app's design (Landing.tsx isSubSubCategoryModalOpen): drag handle, title +
// close, a list of tappable rows (thumbnail, name, arrow), and a "View All"
// button that navigates without a subSubCategory filter.
class _SubSubCategorySelectionSheet extends StatelessWidget {
  final String title;
  final String category;
  final String? subCategory;
  final String? subCategoryLabel;
  final List<Map<String, String>> items;

  const _SubSubCategorySelectionSheet({
    required this.title,
    required this.category,
    this.subCategory,
    this.subCategoryLabel,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 450),
          child: Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.85,
            ),
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppColors.muted.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  // Header row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          title.toUpperCase(),
                          style: const TextStyle(
                            color: AppColors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.muted, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(color: AppColors.border, height: 1),
                  const SizedBox(height: 12),
                  for (final item in items) ...[
                    _SubSubCategoryRow(
                      item: item,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ProductsScreen(
                              category: category,
                              subCategory: subCategory,
                              subSubCategory: item['slug'],
                              initialTitle: item['name'],
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 8),
                  ],
                  const SizedBox(height: 4),
                  OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductsScreen(
                            category: category,
                            subCategory: subCategory,
                            initialTitle: subCategoryLabel,
                          ),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.border),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'VIEW ALL',
                      style: TextStyle(
                        color: AppColors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
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

class _SubSubCategoryRow extends StatelessWidget {
  final Map<String, String> item;
  final VoidCallback onTap;

  const _SubSubCategoryRow({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF0B0B0C),
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              clipBehavior: Clip.antiAlias,
              child: CachedNetworkImage(
                imageUrl: AppConfig.resolveImageUrl(item['imagePath'] ?? ''),
                fit: BoxFit.cover,
                errorWidget: (context, url, error) => const Icon(
                  Icons.broken_image_outlined,
                  color: AppColors.muted,
                  size: 18,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                (item['name'] ?? '').toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.3,
                ),
              ),
            ),
            const Icon(Icons.arrow_forward, color: AppColors.gold, size: 16),
          ],
        ),
      ),
    );
  }
}

class _ShapeSelectionSheet extends StatelessWidget {
  final String title;
  final String category;
  final String? subCategory;
  // The subcategory's own display name (e.g. "1+1 offers"), passed through
  // to the resulting ProductsScreen as its title — matches the web app's
  // mobile app-bar (Products.tsx `displayTitle`).
  final String? subCategoryLabel;
  final String? gender;
  final List<String>? modalShapes;
  final List<dynamic> dbShapes;

  const _ShapeSelectionSheet({
    required this.title,
    required this.category,
    this.subCategory,
    this.subCategoryLabel,
    this.gender,
    this.modalShapes,
    this.dbShapes = const [],
  });

  @override
  Widget build(BuildContext context) {
    final isKids =
        gender == 'kids' ||
        title.toLowerCase().contains('kids') ||
        title.toLowerCase().contains('age');

    if (isKids) {
      return _buildKidsModal(context);
    }

    return _buildShapeModal(context);
  }

  Widget _buildKidsModal(BuildContext context) {
    final kidsOptions = [
      {
        'title': 'Special Edition',
        'image': '/images/kids_special_edition.png',
        'badge': null,
        'badgeColor': null,
        'onTap': (BuildContext ctx) {
          Navigator.pop(ctx);
          Navigator.push(
            ctx,
            MaterialPageRoute(
              builder: (_) => ProductsScreen(
                category: category,
                gender: 'kids',
                tier: 'Sale',
              ),
            ),
          );
        },
      },
      {
        'title': '5 to 8 years',
        'image': '/images/kids_juniors_5_to_8.png',
        'badge': 'JUNIORS',
        'badgeColor': const Color(0xFFEC4899),
        'onTap': (BuildContext ctx) {
          Navigator.pop(ctx);
          Navigator.push(
            ctx,
            MaterialPageRoute(
              builder: (_) => ProductsScreen(
                category: category,
                gender: 'kids',
                size: 'Small',
              ),
            ),
          );
        },
      },
      {
        'title': '8 to 12 years',
        'image': '/images/kids_tweens_8_to_12.png',
        'badge': 'TWEENS',
        'badgeColor': const Color(0xFF10B981),
        'onTap': (BuildContext ctx) {
          Navigator.pop(ctx);
          Navigator.push(
            ctx,
            MaterialPageRoute(
              builder: (_) => ProductsScreen(
                category: category,
                gender: 'kids',
                size: 'Medium',
              ),
            ),
          );
        },
      },
      {
        'title': '12 to 17 years',
        'image': '/images/kids_teens_12_to_17.png',
        'badge': 'TEENS',
        'badgeColor': const Color(0xFF3B82F6),
        'onTap': (BuildContext ctx) {
          Navigator.pop(ctx);
          Navigator.push(
            ctx,
            MaterialPageRoute(
              builder: (_) => ProductsScreen(
                category: category,
                gender: 'kids',
                size: 'Large',
              ),
            ),
          );
        },
      },
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
                    const Text(
                      'KIDS',
                      style: TextStyle(
                        color: AppColors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.close,
                        color: AppColors.white,
                        size: 20,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Grid of 4 kids banner cards
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.1,
                  ),
                  itemCount: kidsOptions.length,
                  itemBuilder: (context, idx) {
                    final opt = kidsOptions[idx];
                    return GestureDetector(
                      onTap: () => (opt['onTap'] as Function)(context),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Stack(
                                children: [
                                  Positioned.fill(
                                    // These paths (e.g. "/images/kids_eyeglasses.png")
                                    // are server-hosted, same as everywhere else in
                                    // the app — not bundled Flutter assets (only
                                    // logo.png/login_hero.jpg are registered in
                                    // pubspec.yaml), so this must resolve/fetch them
                                    // like every other admin image, not Image.asset.
                                    child: CachedNetworkImage(
                                      imageUrl: AppConfig.resolveImageUrl(
                                        opt['image'] as String,
                                      ),
                                      fit: BoxFit.cover,
                                      errorWidget: (_, __, ___) => Container(
                                        color: AppColors.card,
                                        child: const Icon(
                                          Icons.child_care,
                                          color: AppColors.gold,
                                          size: 36,
                                        ),
                                      ),
                                    ),
                                  ),
                                  if (opt['badge'] != null)
                                    Positioned(
                                      top: 8,
                                      left: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: opt['badgeColor'] as Color,
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                        child: Text(
                                          opt['badge'] as String,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 8.5,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            opt['title'] as String,
                            style: const TextStyle(
                              color: AppColors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
                // Full Width Gold Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductsScreen(
                            category: category,
                            gender: 'kids',
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: AppColors.background,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'VIEW ALL KIDS EYEWEAR',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
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

  Widget _buildShapeModal(BuildContext context) {
    // Admin-managed shapes with their own uploaded images (Shape.ts `image`
    // field) — matches the web app exactly (Landing.tsx: dbShapes fetched
    // from /shapes, each rendered as <img src={shape.image}>). Falls back to
    // a fixed name-only list (rendered via a painted icon instead of a real
    // image) only if the admin hasn't configured any shapes at all yet.
    final List<dynamic> shapesSource = dbShapes.isNotEmpty
        ? dbShapes
        : const [
            {'name': 'Aviator'},
            {'name': 'Rectangle'},
            {'name': 'Round'},
            {'name': 'Square'},
            {'name': 'Cat Eye'},
            {'name': 'Geometric'},
          ];
    // Scoped down to the subcategory's own configured "Shapes to display in
    // modal" list when set, matching the web app (Landing.tsx: mappedShapes
    // filters activeShapesList by option.modalShapes, falling back to the
    // full list when none matched).
    final configured = modalShapes;
    final mappedShapes = (configured != null && configured.isNotEmpty)
        ? shapesSource
            .where((s) => configured.any((m) =>
                m.toLowerCase() == (s['name'] ?? '').toString().toLowerCase()))
            .toList()
        : <dynamic>[];
    final shapes = mappedShapes.isNotEmpty ? mappedShapes : shapesSource;

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
                    Expanded(
                      child: Text(
                        title.toUpperCase(),
                        style: const TextStyle(
                          color: AppColors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.close,
                        color: AppColors.white,
                        size: 20,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Circular Shape Badges Grid (3 columns)
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 20,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: shapes.length,
                  itemBuilder: (context, idx) {
                    final shape = shapes[idx];
                    final shapeName = (shape['name'] ?? '').toString();
                    final shapeImage = (shape['image'] ?? '').toString();
                    return GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ProductsScreen(
                              category: category,
                              subCategory: subCategory,
                              shape: shapeName,
                              gender: gender,
                              initialTitle: subCategoryLabel,
                            ),
                          ),
                        );
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Circular Container matching Screenshot 2
                          Container(
                            width: 68,
                            height: 68,
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.border,
                                width: 1.2,
                              ),
                            ),
                            child: shapeImage.isNotEmpty
                                ? ClipOval(
                                    child: CachedNetworkImage(
                                      imageUrl: AppConfig.resolveImageUrl(shapeImage),
                                      fit: BoxFit.cover,
                                      errorWidget: (_, __, ___) => Center(
                                        child: SizedBox(
                                          width: 44,
                                          height: 26,
                                          child: CustomPaint(
                                            painter: FrameShapePainter(
                                              shape: shapeName,
                                              strokeColor: AppColors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  )
                                : Center(
                                    child: SizedBox(
                                      width: 44,
                                      height: 26,
                                      child: CustomPaint(
                                        painter: FrameShapePainter(
                                          shape: shapeName,
                                          strokeColor: AppColors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            shapeName.toUpperCase(),
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
                // View All Shapes button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductsScreen(
                            category: category,
                            subCategory: subCategory,
                            gender: gender,
                            initialTitle: subCategoryLabel,
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.card,
                      foregroundColor: AppColors.white,
                      side: const BorderSide(
                        color: AppColors.border,
                        width: 1.2,
                      ),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'VIEW ALL SHAPES',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
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

      final leftRect = Rect.fromLTWH(
        centerX - gap / 2 - lensW,
        centerY - lensH / 2,
        lensW,
        lensH,
      );
      final rightRect = Rect.fromLTWH(
        centerX + gap / 2,
        centerY - lensH / 2,
        lensW,
        lensH,
      );

      canvas.drawRRect(
        RRect.fromRectAndRadius(leftRect, const Radius.circular(5)),
        framePaint,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(rightRect, const Radius.circular(5)),
        framePaint,
      );

      canvas.drawRRect(
        RRect.fromRectAndRadius(
          leftRect.deflate(1.5),
          const Radius.circular(4),
        ),
        lensPaint,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          rightRect.deflate(1.5),
          const Radius.circular(4),
        ),
        lensPaint,
      );

      final bridgePath = Path()
        ..moveTo(centerX - gap / 2, centerY - 2)
        ..quadraticBezierTo(
          centerX,
          centerY - 5,
          centerX + gap / 2,
          centerY - 2,
        );
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(
        Offset(centerX - gap / 2 - lensW, centerY - 4),
        Offset(centerX - gap / 2 - lensW - 6, centerY - 3),
        detailPaint,
      );
      canvas.drawLine(
        Offset(centerX - gap / 2 - lensW - 6, centerY - 3),
        Offset(centerX - gap / 2 - lensW - 9, centerY + 3),
        detailPaint,
      );

      canvas.drawLine(
        Offset(centerX + gap / 2 + lensW, centerY - 4),
        Offset(centerX + gap / 2 + lensW + 6, centerY - 3),
        detailPaint,
      );
      canvas.drawLine(
        Offset(centerX + gap / 2 + lensW + 6, centerY - 3),
        Offset(centerX + gap / 2 + lensW + 9, centerY + 3),
        detailPaint,
      );
    } else if (shape.toLowerCase() == 'rectangle') {
      lensW = 26;
      lensH = 15;
      gap = 8;

      final leftRect = Rect.fromLTWH(
        centerX - gap / 2 - lensW,
        centerY - lensH / 2,
        lensW,
        lensH,
      );
      final rightRect = Rect.fromLTWH(
        centerX + gap / 2,
        centerY - lensH / 2,
        lensW,
        lensH,
      );

      canvas.drawRRect(
        RRect.fromRectAndRadius(leftRect, const Radius.circular(4)),
        framePaint,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(rightRect, const Radius.circular(4)),
        framePaint,
      );

      canvas.drawRRect(
        RRect.fromRectAndRadius(
          leftRect.deflate(1.5),
          const Radius.circular(3),
        ),
        lensPaint,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          rightRect.deflate(1.5),
          const Radius.circular(3),
        ),
        lensPaint,
      );

      final bridgePath = Path()
        ..moveTo(centerX - gap / 2, centerY - 1)
        ..quadraticBezierTo(
          centerX,
          centerY - 4,
          centerX + gap / 2,
          centerY - 1,
        );
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(
        Offset(centerX - gap / 2 - lensW, centerY - 3),
        Offset(centerX - gap / 2 - lensW - 6, centerY - 2),
        detailPaint,
      );
      canvas.drawLine(
        Offset(centerX - gap / 2 - lensW - 6, centerY - 2),
        Offset(centerX - gap / 2 - lensW - 9, centerY + 3),
        detailPaint,
      );

      canvas.drawLine(
        Offset(centerX + gap / 2 + lensW, centerY - 3),
        Offset(centerX + gap / 2 + lensW + 6, centerY - 2),
        detailPaint,
      );
      canvas.drawLine(
        Offset(centerX + gap / 2 + lensW + 6, centerY - 2),
        Offset(centerX + gap / 2 + lensW + 9, centerY + 3),
        detailPaint,
      );
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

      final leftPathInner = getTeardropPathInner(
        centerX - gap / 2 - lensW,
        true,
      );
      final rightPathInner = getTeardropPathInner(centerX + gap / 2, false);
      canvas.drawPath(leftPathInner, lensPaint);
      canvas.drawPath(rightPathInner, lensPaint);

      final double lTop = centerY - lensH / 2;
      final double lRight = centerX - gap / 2;
      final double rLeft = centerX + gap / 2;

      canvas.drawLine(
        Offset(lRight - 1, lTop + 1),
        Offset(rLeft + 1, lTop + 1),
        detailPaint,
      );

      final bridgePath = Path()
        ..moveTo(lRight, centerY)
        ..quadraticBezierTo(centerX, centerY - 2.5, rLeft, centerY);
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(
        Offset(lRight - lensW, centerY - 3),
        Offset(lRight - lensW - 6, centerY - 2),
        detailPaint,
      );
      canvas.drawLine(
        Offset(lRight - lensW - 6, centerY - 2),
        Offset(lRight - lensW - 9, centerY + 3),
        detailPaint,
      );

      canvas.drawLine(
        Offset(rLeft + lensW, centerY - 3),
        Offset(rLeft + lensW + 6, centerY - 2),
        detailPaint,
      );
      canvas.drawLine(
        Offset(rLeft + lensW + 6, centerY - 2),
        Offset(rLeft + lensW + 9, centerY + 3),
        detailPaint,
      );
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
        ..quadraticBezierTo(
          centerX,
          centerY - 5,
          centerX + gap / 2,
          centerY - 2,
        );
      canvas.drawPath(bridgePath, detailPaint);

      canvas.drawLine(
        Offset(centerX - gap / 2 - lensW, centerY - 3),
        Offset(centerX - gap / 2 - lensW - 6, centerY - 2),
        detailPaint,
      );
      canvas.drawLine(
        Offset(centerX - gap / 2 - lensW - 6, centerY - 2),
        Offset(centerX - gap / 2 - lensW - 9, centerY + 3),
        detailPaint,
      );

      canvas.drawLine(
        Offset(centerX + gap / 2 + lensW, centerY - 3),
        Offset(centerX + gap / 2 + lensW + 6, centerY - 2),
        detailPaint,
      );
      canvas.drawLine(
        Offset(centerX + gap / 2 + lensW + 6, centerY - 2),
        Offset(centerX + gap / 2 + lensW + 9, centerY + 3),
        detailPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
