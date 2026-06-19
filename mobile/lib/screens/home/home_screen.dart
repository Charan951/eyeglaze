import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';
import '../../core/app_config.dart';
import '../../widgets/eyeglaze_logo.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
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
                    border: Border.all(color: AppColors.gold.withOpacity(0.6)),
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
                                color: AppColors.white.withOpacity(0.5),
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
      onTap: () => setState(() => _currentTab = index),
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
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
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
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProductsScreen()),
            ),
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
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.white),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
              ),
              Positioned(
                right: 8, top: 8,
                child: Container(
                  width: 14, height: 14,
                  decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
                  child: const Center(child: Text('0', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))),
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
          _HeroBanner(),
          _CategoryGrids(),
          _FeaturedProducts(),
          _PromoBanners(),
          SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _HeroBanner extends StatefulWidget {
  const _HeroBanner();

  @override
  State<_HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<_HeroBanner> {
  late PageController _pageController;
  late Timer _timer;
  int _currentIndex = 0;

  final List<Map<String, String>> _slides = const [
    {
      'subtitle': 'SEE THE WORLD',
      'title': 'CLEARER.\nSHARPER.\nYOU.',
      'description': 'Premium Eyewear for Every Version of You.',
      'button': 'SHOP NOW',
      'image': '/images/hero_model.png',
    },
    {
      'subtitle': 'EXCLUSIVE DESIGNS',
      'title': 'STYLE.\nCOMFORT.\nLUXURY.',
      'description': 'Uncompromising quality meets timeless luxury.',
      'button': 'EXPLORE ALL',
      'image': '/images/promo_new_arrivals.png',
    }
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _timer = Timer.periodic(const Duration(seconds: 6), (timer) {
      if (_pageController.hasClients) {
        final nextPage = (_currentIndex + 1) % _slides.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        height: 220,
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              PageView.builder(
                controller: _pageController,
                onPageChanged: (idx) => setState(() => _currentIndex = idx),
                itemCount: _slides.length,
                itemBuilder: (context, idx) {
                  final slide = _slides[idx];
                  return LayoutBuilder(
                    builder: (context, constraints) {
                      final cardWidth = constraints.maxWidth;
                      return Stack(
                        children: [
                          // Model Image (Right side)
                          Positioned(
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: cardWidth * 0.5,
                            child: ClipRRect(
                              borderRadius: const BorderRadius.horizontal(right: Radius.circular(16)),
                              child: CachedNetworkImage(
                                imageUrl: AppConfig.resolveImageUrl(slide['image']!),
                                fit: BoxFit.cover,
                                alignment: Alignment.center,
                                errorWidget: (_, __, ___) => Container(color: Colors.transparent),
                              ),
                            ),
                          ),
                          // Text Details (Left side)
                          Positioned(
                            left: 18,
                            top: 18,
                            bottom: 18,
                            width: cardWidth * 0.46,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Row(
                                  children: [
                                    Container(width: 14, height: 1.5, color: AppColors.gold),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        slide['subtitle']!,
                                        style: const TextStyle(
                                          color: AppColors.gold,
                                          fontSize: 8.5,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.2,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  slide['title']!,
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontSize: 19,
                                    fontWeight: FontWeight.w900,
                                    height: 1.15,
                                    letterSpacing: 0.5,
                                  ),
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  slide['description']!,
                                  style: TextStyle(
                                    color: AppColors.white.withOpacity(0.6),
                                    fontSize: 9,
                                    height: 1.3,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 10),
                                GestureDetector(
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const ProductsScreen()),
                                  ),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: AppColors.gold, width: 1.2),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          slide['button']!,
                                          style: const TextStyle(
                                            color: AppColors.gold,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 1.0,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        const Icon(
                                          Icons.arrow_forward,
                                          color: AppColors.gold,
                                          size: 10,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12), // spacer for dots
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
              // Pagination Dots (Bottom left under button)
              Positioned(
                bottom: 14,
                left: 18,
                child: Row(
                  children: List.generate(_slides.length, (i) {
                    final isActive = i == _currentIndex;
                    return Container(
                      margin: const EdgeInsets.only(right: 6),
                      width: isActive ? 18 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.gold : Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
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
                errorWidget: (_, __, ___) => const Center(
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
                      Colors.black.withOpacity(0.5),
                      Colors.black.withOpacity(0.85),
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

class _CategoryGrids extends StatelessWidget {
  const _CategoryGrids();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Eyeglasses
          const Text('EYEGLASSES', style: TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 8),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 3 / 4.2,
            children: [
              _CategoryCard(
                label: 'Men',
                imagePath: '/images/men_eyeglasses.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Prescription'))),
              ),
              _CategoryCard(
                label: 'Women',
                imagePath: '/images/women_eyeglasses.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Prescription'))),
              ),
              _CategoryCard(
                label: 'Kids',
                imagePath: '/images/kids_eyeglasses.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Kids'))),
              ),
              _CategoryCard(
                label: 'Contact Lens',
                imagePath: '/images/cat_contacts.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Contact Lenses'))),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Sunglasses & Accessories
          const Text('SUNGLASSES & ACCESSORIES', style: TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 8),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 3 / 4.2,
            children: [
              _CategoryCard(
                label: 'Men',
                imagePath: '/images/men_sunglasses.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Sunglasses'))),
              ),
              _CategoryCard(
                label: 'Women',
                imagePath: '/images/women_sunglasses.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Sunglasses'))),
              ),
              _CategoryCard(
                label: 'Kids',
                imagePath: '/images/kids_sunglasses.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Kids'))),
              ),
              _CategoryCard(
                label: 'Accessories',
                imagePath: '/images/accessories.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Accessories'))),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Reading Glasses
          const Text('READING GLASSES', style: TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 8),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1.35 / 1,
            children: [
              _CategoryCard(
                label: 'Zero Power',
                imagePath: '/images/zero_power_glasses.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Zero Power'))),
              ),
              _CategoryCard(
                label: 'Reading',
                imagePath: '/images/reading_book.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Reading'))),
              ),
              _CategoryCard(
                label: 'Power Sun',
                imagePath: '/images/transition_lens.png',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(category: 'Sunglasses'))),
              ),
            ],
          ),
        ],
      ),
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
                          decoration: BoxDecoration(color: AppColors.gold.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
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
                      border: Border.all(color: AppColors.gold.withOpacity(0.35)),
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
                                style: TextStyle(color: AppColors.white.withOpacity(0.5), fontSize: 8),
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
                        color: AppColors.error.withOpacity(0.1),
                        border: Border.all(color: AppColors.error.withOpacity(0.3)),
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
                            decoration: BoxDecoration(color: AppColors.gold.withOpacity(0.08)),
                            children: [
                              Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10), child: Text('TOTAL SAVINGS', style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold))),
                              Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10), child: Text('₹7,000+', style: const TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                child: Text('Fee: ₹129 only!', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 7, fontWeight: FontWeight.bold), textAlign: TextAlign.right),
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
                          Text('/ Year', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 9, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                  if (user?.membershipActive == true)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        border: Border.all(color: Colors.green.withOpacity(0.3)),
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
          Text(text, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 8.5, fontWeight: FontWeight.bold)),
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
            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 7, height: 1.1),
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
        Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7), child: Text(val, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 8), textAlign: TextAlign.right)),
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
                      Text('Manage Balance & Cashback', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 8)),
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
              border: Border.all(color: AppColors.gold.withOpacity(0.25)),
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
                                  style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 8),
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
                Text(date, style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 8)),
              ],
            ),
            Text(amount, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
