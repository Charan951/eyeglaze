import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../core/app_config.dart';
import '../../models/product.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/eyeglaze_logo.dart';
import '../../widgets/lens_wizard_state.dart';
import '../lens/lens_type_screen.dart';
import '../cart/cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _selectedColorIdx = 0;
  int _currentImage = 0;
  int _cartCount = 0;

  // Size Selector State
  String _selectedSize = 'Medium';

  String get recommendedSize {
    final width = p.frame?.width;
    if (width == null) return 'Medium';
    if (width <= 135) return 'Small';
    if (width >= 143) return 'Large';
    return 'Medium';
  }

  Map<String, double?> get activeDimensions {
    if (p.sizeMeasurements.isNotEmpty) {
      try {
        final match = p.sizeMeasurements.firstWhere((item) => item.size == _selectedSize);
        return {
          'frameWidth': match.frameWidth ?? p.frame?.width,
          'lensWidth': match.lensWidth ?? p.frame?.lensWidth,
          'bridgeWidth': match.bridgeWidth ?? p.frame?.bridgeWidth,
          'templeLength': match.templeLength ?? p.frame?.templeLength,
          'frameHeight': match.frameHeight ?? 40.0,
        };
      } catch (_) {}
    }
    return {
      'frameWidth': p.frame?.width,
      'lensWidth': p.frame?.lensWidth,
      'bridgeWidth': p.frame?.bridgeWidth,
      'templeLength': p.frame?.templeLength,
      'frameHeight': 40.0,
    };
  }

  // Wishlist and Reviews State
  bool _isInWishlist = false;
  double _rating = 0;
  int _reviewCount = 0;
  List<dynamic> _reviews = [];
  List<Product> _similarProducts = [];
  bool _similarLoading = true;

  Future<void> _loadCartCount() async {
    try {
      final auth = context.read<AuthService>();
      if (auth.isLoggedIn) {
        final api = ApiService(auth);
        final data = await api.getCart();
        final items = ((data['cart'] as Map?)?['items'] ?? data['items'] ?? []) as List;
        if (mounted) {
          setState(() {
            _cartCount = items.length;
          });
        }
      }
    } catch (_) {}
  }

  // Review Form Controllers
  final _reviewNameCtrl = TextEditingController();
  final _reviewTitleCtrl = TextEditingController();
  final _reviewCommentCtrl = TextEditingController();
  int _newReviewRating = 5;
  bool _showReviewForm = false;
  bool _reviewSuccess = false;

  Product? _detailedProduct;
  Product get p => _detailedProduct ?? widget.product;

  bool get isContactLenses {
    final catLower = p.categories.map((c) => c.toLowerCase()).toList();
    return catLower.contains('contact-lenses') || 
           catLower.contains('contact_lenses') || 
           catLower.contains('contact');
  }

  bool get isReadingGlasses {
    final catLower = p.categories.map((c) => c.toLowerCase()).toList();
    return catLower.contains('power-sunglasses') && (p.subCategory?.toLowerCase() == 'reading');
  }

  bool get isKidsProduct {
    final gendersLower = p.gender.map((g) => g.toLowerCase()).toList();
    return gendersLower.contains('kids');
  }

  bool get hasAnySpecs {
    final frameType = p.frameType ?? p.frame?.type;
    final material = p.material ?? p.frame?.material;
    return (frameType != null && frameType.isNotEmpty) ||
           (p.frameShape != null && p.frameShape!.isNotEmpty) ||
           (material != null && material.isNotEmpty) ||
           (p.frameWeight != null && p.frameWeight!.isNotEmpty) ||
           (p.countryOfOrigin != null && p.countryOfOrigin!.isNotEmpty) ||
           (p.manufacturer != null && p.manufacturer!.isNotEmpty) ||
           (p.warranty != null && p.warranty!.isNotEmpty);
  }

  double get displayPrice => _customPriceOverride ?? p.sellingPrice;

  String? _selectedContactPower;
  double? _customPriceOverride;
  String? _selectedReadingPower;

  List<String> get imagesList {
    final colors = p.colors;
    if (colors.isNotEmpty && _selectedColorIdx < colors.length) {
      final colorImgs = colors[_selectedColorIdx].images.where((img) => img.isNotEmpty).toList();
      if (colorImgs.isNotEmpty) {
        return colorImgs;
      }
    }

    final List<String> fallbackAssets = [
      '/images/cat_prescription.png',
      '/images/cat_sunglasses.png',
      '/images/cat_blue_light.png',
      '/images/cat_contacts.png',
      '/images/hero_model.png',
    ];

    final List<String> result = [];
    for (int i = 0; i < 5; i++) {
      if (i < p.images.length && p.images[i].isNotEmpty) {
        result.add(p.images[i]);
      } else {
        result.add(fallbackAssets[i]);
      }
    }
    return result;
  }

  String get selectedColorName {
    final colors = p.colors;
    if (colors.isNotEmpty && _selectedColorIdx < colors.length) {
      return colors[_selectedColorIdx].name;
    }
    return 'Default';
  }

  @override
  void initState() {
    super.initState();
    _rating = p.rating;
    _reviewCount = p.reviewCount;
    _reviews = _getMockReviews();
    _checkWishlistStatus();
    _loadProductDetails();
    _loadCartCount();
    final available = p.availableSizes.isNotEmpty ? p.availableSizes : const ['Small', 'Medium', 'Large'];
    final recSize = recommendedSize;
    if (available.contains(recSize)) {
      _selectedSize = recSize;
    } else {
      _selectedSize = available.first;
    }
  }

  @override
  void dispose() {
    _reviewNameCtrl.dispose();
    _reviewTitleCtrl.dispose();
    _reviewCommentCtrl.dispose();
    super.dispose();
  }

  // Wishlist Checks
  Future<void> _checkWishlistStatus() async {
    try {
      final auth = context.read<AuthService>();
      if (!auth.isLoggedIn) return;
      final api = ApiService(auth);
      final res = await api.getWishlist();
      final list = (res['wishlist'] ?? []) as List;
      final found = list.any((item) => (item['_id'] ?? item['id']) == p.id);
      if (mounted) {
        setState(() => _isInWishlist = found);
      }
    } catch (_) {}
  }

  Future<void> _toggleWishlist() async {
    final auth = context.read<AuthService>();
    if (!auth.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to manage your wishlist'), backgroundColor: AppColors.error),
      );
      Navigator.pushNamed(context, '/login');
      return;
    }

    final originalStatus = _isInWishlist;
    setState(() => _isInWishlist = !originalStatus);

    try {
      final api = ApiService(auth);
      await api.toggleWishlist(p.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isInWishlist ? 'Added to wishlist!' : 'Removed from wishlist!'),
            backgroundColor: AppColors.gold,
            duration: const Duration(seconds: 1),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isInWishlist = originalStatus);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update wishlist'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  // Fetch product and reviews from server
  Future<void> _loadProductDetails() async {
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final res = await api.getProduct(p.id);

      final dynamic prodData = res['product'] ?? res;
      final List<dynamic> backendReviews = res['reviews'] ?? [];

      if (mounted) {
        setState(() {
          if (prodData is Map) {
            _detailedProduct = Product.fromJson(prodData as Map<String, dynamic>);
            _rating = _detailedProduct!.rating;
            _reviewCount = _detailedProduct!.reviewCount;
            final available = _detailedProduct!.availableSizes.isNotEmpty 
                ? _detailedProduct!.availableSizes 
                : const ['Small', 'Medium', 'Large'];
            final recSize = recommendedSize;
            if (available.contains(recSize)) {
              _selectedSize = recSize;
            } else if (!available.contains(_selectedSize)) {
              _selectedSize = available.first;
            }
          }

          if (backendReviews.isNotEmpty) {
            _reviews = backendReviews;
          } else {
            _reviews = _getMockReviews();
          }
        });
      }

      // Load similar products
      final cat = p.categories.isNotEmpty ? p.categories.first : '';
      if (cat.isNotEmpty) {
        final similarRes = await api.getProducts(category: cat);
        final similarList = (similarRes['products'] ?? similarRes['data'] ?? []) as List;
        if (mounted) {
          setState(() {
            _similarProducts = similarList
                .map((x) => Product.fromJson(x as Map<String, dynamic>))
                .where((x) => x.id != p.id)
                .take(4)
                .toList();
            _similarLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _similarLoading = false;
          });
        }
      }
    } catch (e, stack) {
      debugPrint("Error loading product details: $e\n$stack");
      if (mounted) {
        setState(() {
          _rating = p.rating;
          _reviewCount = p.reviewCount;
          _reviews = _getMockReviews();
          _similarLoading = false;
        });
      }
    }
  }

  List<dynamic> _getMockReviews() {
    return [
      {
        '_id': 'rev-1',
        'user': {'name': 'Rahul Sharma'},
        'rating': 5,
        'title': 'Superb quality and fit!',
        'comment': 'The ${p.name} fits perfectly. It is extremely lightweight, feels very durable, and the style is very modern. Absolutely love it!',
        'isVerifiedPurchase': true,
        'createdAt': DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
      },
      {
        '_id': 'rev-2',
        'user': {'name': 'Priya Patel'},
        'rating': 4,
        'title': 'Very comfortable for daily use',
        'comment': 'Nice product. The frames are very comfortable to wear for long working hours in front of screens. Recommended!',
        'isVerifiedPurchase': true,
        'createdAt': DateTime.now().subtract(const Duration(days: 10)).toIso8601String(),
      },
      {
        '_id': 'rev-3',
        'user': {'name': 'Amit Kumar'},
        'rating': 5,
        'title': 'Value for Money',
        'comment': 'Excellent eyeglasses, premium packaging, and fast delivery. Exceptional quality for the price.',
        'isVerifiedPurchase': true,
        'createdAt': DateTime.now().subtract(const Duration(days: 15)).toIso8601String(),
      }
    ];
  }

  // Share
  void _shareProduct() {
    Clipboard.setData(ClipboardData(text: 'https://web.eyeglaze.in/products/${p.id}'));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Product link copied to clipboard!'),
        backgroundColor: AppColors.gold,
      ),
    );
  }

  // Custom Review Submission
  void _submitReview() {
    final name = _reviewNameCtrl.text.trim();
    final title = _reviewTitleCtrl.text.trim();
    final comment = _reviewCommentCtrl.text.trim();

    if (name.isEmpty || title.isEmpty || comment.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all review fields'), backgroundColor: AppColors.error),
      );
      return;
    }

    final newRev = {
      '_id': 'local-rev-${DateTime.now().millisecondsSinceEpoch}',
      'user': {'name': name},
      'rating': _newReviewRating,
      'title': title,
      'comment': comment,
      'isVerifiedPurchase': true,
      'createdAt': DateTime.now().toIso8601String(),
    };

    setState(() {
      _reviews.insert(0, newRev);
      final totalRatingSum = (_rating * _reviewCount) + _newReviewRating;
      _reviewCount += 1;
      _rating = double.parse((totalRatingSum / _reviewCount).toStringAsFixed(1));
      _reviewSuccess = true;
      _reviewNameCtrl.clear();
      _reviewTitleCtrl.clear();
      _reviewCommentCtrl.clear();
      _newReviewRating = 5;
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _showReviewForm = false;
          _reviewSuccess = false;
        });
      }
    });
  }

  // AI Chat assistant Bottom Sheet drawer
  void _openAiChat() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AiChatBottomSheetContent(
        sku: p.sku,
        price: p.sellingPrice,
        frameWidth: p.frame?.width?.toInt() ?? 140,
        lensWidth: p.frame?.lensWidth?.toInt() ?? 54,
        bridgeWidth: p.frame?.bridgeWidth?.toInt() ?? 18,
        templeLength: p.frame?.templeLength?.toInt() ?? 145,
      ),
    );
  }

  Widget _buildTrustStrip() {
    final items = [
      {'icon': Icons.verified, 'label': '100% Authentic\nOriginal Products'},
      {'icon': Icons.local_shipping, 'label': 'Just ₹99\nDelivery Charge'},
      {'icon': Icons.flash_on, 'label': 'Fast Delivery\nGuaranteed'},
      {'icon': Icons.support_agent, 'label': '24/7 Support\nWe\'re here to help'},
    ];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: items.map((item) {
          return Expanded(
            child: Column(
              children: [
                Icon(item['icon'] as IconData, color: AppColors.gold, size: 20),
                const SizedBox(height: 6),
                Text(
                  item['label'] as String,
                  style: const TextStyle(color: Colors.white70, fontSize: 9),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    try {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.white),
            onPressed: () => Navigator.pop(context),
          ),
          title: const EyeGlazeLogo(),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.share_outlined, color: AppColors.white),
              onPressed: _shareProduct,
            ),
            IconButton(
              icon: Icon(
                _isInWishlist ? Icons.favorite : Icons.favorite_border,
                color: _isInWishlist ? AppColors.gold : AppColors.white,
              ),
              onPressed: _toggleWishlist,
            ),
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.white),
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CartScreen()),
                    );
                    _loadCartCount();
                  },
                ),
                if (_cartCount > 0)
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
                      child: Center(
                        child: Text(
                          '$_cartCount',
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
                // Top side-by-side layout (Row)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Left side: Image Carousel Card
                      Expanded(
                        flex: 5,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              height: 180,
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Stack(
                                  children: [
                                    Center(
                                      child: CachedNetworkImage(
                                        imageUrl: AppConfig.resolveImageUrl(imagesList[_currentImage]),
                                        fit: BoxFit.contain,
                                        placeholder: (context, url) => const CircularProgressIndicator(color: AppColors.gold),
                                        errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 50),
                                      ),
                                    ),
                                    Positioned(
                                      top: 8,
                                      left: 8,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (p.isBestseller)
                                            Container(
                                              margin: const EdgeInsets.only(bottom: 4),
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                              decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)),
                                              child: const Text('BESTSELLER', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                                            ),
                                          if (p.isPremium)
                                            Container(
                                              margin: const EdgeInsets.only(bottom: 4),
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: Colors.black.withValues(alpha: 0.75),
                                                border: Border.all(color: AppColors.gold, width: 1),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Text('PREMIUM', style: TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold)),
                                            ),
                                          if (p.buy1Get1)
                                            Container(
                                              margin: const EdgeInsets.only(bottom: 4),
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                              decoration: BoxDecoration(color: Colors.pink.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(4)),
                                              child: const Text('BUY 1 GET 1', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                                            ),
                                          if (p.oneRupeeFrameOffer)
                                            Container(
                                              margin: const EdgeInsets.only(bottom: 4),
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                              decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(4)),
                                              child: const Text('₹1 FRAME OFFER', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                                            ),
                                          ...p.offerBadges.map((badge) => Container(
                                                margin: const EdgeInsets.only(bottom: 4),
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                decoration: BoxDecoration(color: Colors.purple.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(4)),
                                                child: Text(badge.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                                              )),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            // Carousel Indicators (Dots)
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(imagesList.length, (idx) {
                                final isActive = idx == _currentImage;
                                return GestureDetector(
                                  onTap: () => setState(() => _currentImage = idx),
                                  child: Container(
                                    margin: const EdgeInsets.symmetric(horizontal: 3),
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: isActive ? AppColors.gold : Colors.white24,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                );
                              }),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Right side: Info Column
                      Expanded(
                        flex: 5,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${p.sku} | ${p.name}'.toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                letterSpacing: 0.5,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            // Rating and purchase count
                            Row(
                              children: [
                                const Icon(Icons.star, color: AppColors.gold, size: 12),
                                const SizedBox(width: 2),
                                Text(
                                  '${_rating.toStringAsFixed(1)} ',
                                  style: const TextStyle(color: AppColors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                                Expanded(
                                  child: Text(
                                    '($_reviewCount reviews) | ${p.soldCount > 0 ? p.soldCount : 500}+ bought this week',
                                    style: const TextStyle(color: Colors.white54, fontSize: 8.5),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            // Frame starting box
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                border: Border.all(color: AppColors.border),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    isContactLenses ? 'CONTACT LENS PRICE' : 'FRAME STARTING',
                                    style: const TextStyle(color: Colors.white38, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                  ),
                                  const SizedBox(height: 4),
                                  if (!isContactLenses && p.memberPrice != null && p.nonMemberPrice != null) ...[
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              '₹${p.memberPrice!.toInt()}',
                                              style: const TextStyle(color: AppColors.gold, fontSize: 18, fontWeight: FontWeight.w900),
                                            ),
                                            const SizedBox(width: 4),
                                            const Text('(Member)', style: TextStyle(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.bold)),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Row(
                                          children: [
                                            Text(
                                              '₹${p.nonMemberPrice!.toInt()}',
                                              style: const TextStyle(color: AppColors.white, fontSize: 14, fontWeight: FontWeight.w900),
                                            ),
                                            const SizedBox(width: 4),
                                            const Text('(Non-Member)', style: TextStyle(color: Colors.white38, fontSize: 9)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ] else
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        Text(
                                          '₹${displayPrice.toInt()}',
                                          style: const TextStyle(color: AppColors.white, fontSize: 18, fontWeight: FontWeight.w900),
                                        ),
                                        if (_customPriceOverride == null) ...[
                                          const SizedBox(width: 6),
                                          Text(
                                            '₹${p.originalPrice.toInt()}',
                                            style: const TextStyle(color: Colors.white38, fontSize: 11, decoration: TextDecoration.lineThrough),
                                          ),
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppColors.gold.withValues(alpha: 0.15),
                                              border: Border.all(color: AppColors.gold.withValues(alpha: 0.3), width: 1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              '${((p.originalPrice - p.sellingPrice) / p.originalPrice * 100).round()}% OFF',
                                              style: const TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.w800),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isContactLenses) ...[
                        const SizedBox(height: 8),
                        // Color selector
                        Text(
                          'SELECT COLOR: ${selectedColorName.toUpperCase()}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        if (p.colors.isNotEmpty)
                          Row(
                            children: [
                              ...p.colors.take(4).toList().asMap().entries.map((e) {
                                final isSelected = e.key == _selectedColorIdx;
                                final color = e.value;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 12),
                                  child: GestureDetector(
                                    onTap: () => setState(() => _selectedColorIdx = e.key),
                                    child: SizedBox(
                                      width: 34,
                                      height: 34,
                                      child: Stack(
                                        children: [
                                          Container(
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: _parseHexColor(color.hex),
                                              border: Border.all(
                                                color: isSelected ? AppColors.gold : AppColors.border,
                                                width: isSelected ? 2.5 : 1,
                                              ),
                                            ),
                                          ),
                                          if (isSelected)
                                            Positioned(
                                              bottom: 0,
                                              right: 0,
                                              child: Container(
                                                padding: const EdgeInsets.all(2),
                                                decoration: const BoxDecoration(
                                                  color: AppColors.gold,
                                                  shape: BoxShape.circle,
                                                ),
                                                child: const Icon(Icons.check, color: Colors.black, size: 8),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }),
                              if (p.colors.length > 4)
                                Container(
                                  width: 34,
                                  height: 34,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColors.card,
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: Center(
                                    child: Text(
                                      '+${p.colors.length - 4}',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        
                        // Choose Size section
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'CHOOSE SIZE',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Icon(Icons.help_outline, color: Colors.white.withValues(alpha: 0.5), size: 14),
                              ],
                            ),
                            GestureDetector(
                              onTap: () {
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    backgroundColor: AppColors.card,
                                    title: const Text('Size Guide', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    content: const Text(
                                      'Small: Up to 135 mm (Narrow face)\n'
                                      'Medium: 136 mm to 142 mm (Standard face)\n'
                                      'Large: 143 mm to 150 mm (Wide face)\n\n'
                                      'Measure your face width temple-to-temple to find your ideal fit.',
                                      style: TextStyle(color: Colors.white70),
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('CLOSE', style: TextStyle(color: AppColors.gold)),
                                      ),
                                    ],
                                  ),
                                );
                              },
                              child: const Text(
                                "What's my size?",
                                style: TextStyle(
                                  color: AppColors.gold,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Builder(
                          builder: (context) {
                            final List<Widget> sizeCards = [];
                            final activeSizes = ['Small', 'Medium', 'Large']
                                .where((size) => p.availableSizes.contains(size))
                                .toList();
                            final displaySizes = activeSizes.isNotEmpty ? activeSizes : const ['Small', 'Medium', 'Large'];
                            
                            for (int i = 0; i < displaySizes.length; i++) {
                              final size = displaySizes[i];
                              String range = 'Up to 135 mm';
                              String desc = 'Best for narrow face';
                              if (size == 'Medium') {
                                range = '136 – 142 mm';
                                desc = 'Best for standard face';
                              } else if (size == 'Large') {
                                range = '143 – 150 mm';
                                desc = 'Best for wide face';
                              }
                              
                              sizeCards.add(Expanded(child: _buildSizeCard(size, range, desc)));
                              if (i < displaySizes.length - 1) {
                                sizeCards.add(const SizedBox(width: 8));
                              }
                            }
                            return Row(children: sizeCards);
                          }
                        ),
                        const SizedBox(height: 20),
                        // Frame Dimensions Title Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'FRAME DIMENSIONS (in mm)',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                letterSpacing: 0.5,
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    backgroundColor: AppColors.card,
                                    title: const Text('Technical Details', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    content: Text(
                                      'SKU: ${p.sku}\n'
                                      'Frame Type: ${p.frame?.type ?? "Standard"}\n'
                                      'Material: ${p.frame?.material ?? "Premium TR90"}\n'
                                      'Frame Width: ${activeDimensions['frameWidth']?.toInt() ?? 0} mm\n'
                                      'Lens Width: ${activeDimensions['lensWidth']?.toInt() ?? 0} mm\n'
                                      'Bridge: ${activeDimensions['bridgeWidth']?.toInt() ?? 0} mm\n'
                                      'Temple Length: ${activeDimensions['templeLength']?.toInt() ?? 0} mm',
                                      style: const TextStyle(color: Colors.white70),
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('CLOSE', style: TextStyle(color: AppColors.gold)),
                                      ),
                                    ],
                                  ),
                                );
                              },
                              child: const Row(
                                children: [
                                  Text(
                                    'Technical Details',
                                    style: TextStyle(
                                      color: AppColors.gold,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(width: 4),
                                  Icon(Icons.keyboard_arrow_up, color: AppColors.gold, size: 14),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _FrameSpecs(
                          frameWidth: activeDimensions['frameWidth'] ?? 0.0,
                          lensWidth: activeDimensions['lensWidth'] ?? 0.0,
                          bridgeWidth: activeDimensions['bridgeWidth'] ?? 0.0,
                          templeLength: activeDimensions['templeLength'] ?? 0.0,
                        ),
                        if (!isContactLenses && hasAnySpecs) ...[
                          const SizedBox(height: 10),
                          _FrameDetails(product: p),
                          const SizedBox(height: 20),
                        ],
                      ],
                      if (isReadingGlasses) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'SELECT READING POWER',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: p.readingPowers.map((power) {
                            final isSelected = _selectedReadingPower == power;
                            return ChoiceChip(
                              label: Text(
                                power,
                                style: TextStyle(
                                  color: isSelected ? Colors.black : Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                              selected: isSelected,
                              selectedColor: AppColors.gold,
                              backgroundColor: AppColors.card,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: BorderSide(
                                  color: isSelected ? AppColors.gold : AppColors.border,
                                  width: 1,
                                ),
                              ),
                              onSelected: (selected) {
                                setState(() {
                                  _selectedReadingPower = selected ? power : null;
                                });
                              },
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],
                      if (isContactLenses) ...[
                        const SizedBox(height: 16),
                        Text(
                          'SELECT CONTACT LENS POWER (${p.contactDisposableType ?? "Monthly"})'.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: p.contactPowers.map((cp) {
                            final isSelected = _selectedContactPower == cp.power;
                            return ChoiceChip(
                              label: Text(
                                cp.power,
                                style: TextStyle(
                                  color: isSelected ? Colors.black : Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                              selected: isSelected,
                              selectedColor: AppColors.gold,
                              backgroundColor: AppColors.card,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: BorderSide(
                                  color: isSelected ? AppColors.gold : AppColors.border,
                                  width: 1,
                                ),
                              ),
                              onSelected: (selected) {
                                setState(() {
                                  _selectedContactPower = selected ? cp.power : null;
                                  _customPriceOverride = selected ? cp.price : null;
                                });
                              },
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ],
                  ),
                ),
                _buildTrustStrip(),
                // AI help banner
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                    child: Row(
                      children: [
                        const Icon(Icons.chat_bubble_outline, color: AppColors.gold, size: 22),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Need Help?',
                                style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Chat with our AI Assistant',
                                style: TextStyle(color: AppColors.muted, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: _openAiChat,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(border: Border.all(color: AppColors.gold), borderRadius: BorderRadius.circular(8)),
                            child: const Text('CHAT NOW', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Related Products Section
                if (!_similarLoading && _similarProducts.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Related Products',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'YOU MIGHT ALSO LIKE THESE RELATED FRAMES',
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.62,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                          ),
                          itemCount: _similarProducts.length,
                          itemBuilder: (context, i) {
                            final sp = _similarProducts[i];
                            return _SimilarProductCard(
                              product: sp,
                              onTap: () {
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ProductDetailScreen(product: sp),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                // Reviews Section
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Customer Reviews', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                              SizedBox(height: 4),
                              Text('What our customers say about this frame', style: TextStyle(color: AppColors.muted, fontSize: 11)),
                            ],
                          ),
                          TextButton(
                            onPressed: () => setState(() {
                              _showReviewForm = !_showReviewForm;
                              _reviewSuccess = false;
                            }),
                            style: TextButton.styleFrom(
                              side: const BorderSide(color: AppColors.gold),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: Text(_showReviewForm ? 'Cancel' : 'Write a Review', style: const TextStyle(color: AppColors.gold, fontSize: 12)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Collapsible Review Form
                      if (_showReviewForm)
                        Container(
                          padding: const EdgeInsets.all(16),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: _reviewSuccess
                              ? const Center(
                                  child: Padding(
                                    padding: EdgeInsets.symmetric(vertical: 24),
                                    child: Column(
                                      children: [
                                        Icon(Icons.check_circle, color: AppColors.success, size: 40),
                                        SizedBox(height: 8),
                                        Text('Thank you! Your review has been added successfully.', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13), textAlign: TextAlign.center),
                                      ],
                                    ),
                                  ),
                                )
                              : Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Share Your Feedback', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                    const SizedBox(height: 12),
                                    const Text('YOUR NAME', style: TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 4),
                                    TextField(
                                      controller: _reviewNameCtrl,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      decoration: const InputDecoration(hintText: 'Enter your name'),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text('RATING', style: TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: List.generate(5, (index) {
                                        final starVal = index + 1;
                                        return GestureDetector(
                                          onTap: () => setState(() => _newReviewRating = starVal),
                                          child: Icon(
                                            starVal <= _newReviewRating ? Icons.star : Icons.star_border,
                                            color: AppColors.gold,
                                            size: 28,
                                          ),
                                        );
                                      }),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text('REVIEW TITLE', style: TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 4),
                                    TextField(
                                      controller: _reviewTitleCtrl,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      decoration: const InputDecoration(hintText: 'Summarize your experience'),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text('COMMENTS', style: TextStyle(color: AppColors.muted, fontSize: 9, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 4),
                                    TextField(
                                      controller: _reviewCommentCtrl,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      maxLines: 3,
                                      decoration: const InputDecoration(hintText: 'Tell us what you liked or disliked about this frame'),
                                    ),
                                    const SizedBox(height: 16),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton(
                                        onPressed: _submitReview,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.gold,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                        child: const Text('SUBMIT REVIEW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                      ),
                                    ),
                                  ],
                                ),
                        ),

                      // Aggregate Rating summary bars
                      Container(
                        padding: const EdgeInsets.all(16),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(_rating.toStringAsFixed(1), style: const TextStyle(color: AppColors.white, fontSize: 44, fontWeight: FontWeight.w900)),
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: List.generate(
                                      5,
                                      (i) => Icon(
                                        i < _rating.floor() ? Icons.star : (i < _rating ? Icons.star_half : Icons.star_outline),
                                        color: AppColors.gold,
                                        size: 14,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text('$_reviewCount reviews', style: const TextStyle(color: AppColors.muted, fontSize: 10)),
                                ],
                              ),
                            ),
                            Container(width: 1, height: 80, color: AppColors.border, margin: const EdgeInsets.symmetric(horizontal: 16)),
                            Expanded(
                              flex: 5,
                              child: Column(
                                children: [
                                  _RatingPercentageRow(stars: 5, pct: 75),
                                  _RatingPercentageRow(stars: 4, pct: 15),
                                  _RatingPercentageRow(stars: 3, pct: 6),
                                  _RatingPercentageRow(stars: 2, pct: 3),
                                  _RatingPercentageRow(stars: 1, pct: 1),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Reviews List
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _reviews.length,
                        itemBuilder: (context, i) {
                          final rev = _reviews[i];
                          
                          final dynamic userVal = rev['user'];
                          String name = 'User';
                          if (userVal is Map) {
                            name = userVal['name']?.toString() ?? 'User';
                          } else if (userVal is String) {
                            name = userVal;
                          }

                          final dynamic ratingVal = rev['rating'];
                          double rating = 5.0;
                          if (ratingVal is num) {
                            rating = ratingVal.toDouble();
                          } else if (ratingVal is String) {
                            rating = double.tryParse(ratingVal) ?? 5.0;
                          }

                          final String title = rev['title']?.toString() ?? '';
                          final String comment = rev['comment']?.toString() ?? '';
                          
                          final dynamic verifiedVal = rev['isVerifiedPurchase'];
                          final bool isVerified = verifiedVal is bool ? verifiedVal : false;

                          final dynamic rawCreatedAt = rev['createdAt'];
                          final DateTime createdAt;
                          if (rawCreatedAt is String) {
                            createdAt = DateTime.tryParse(rawCreatedAt) ?? DateTime.now();
                          } else if (rawCreatedAt is DateTime) {
                            createdAt = rawCreatedAt;
                          } else {
                            createdAt = DateTime.now();
                          }
                          final dateStr = DateFormat('d MMM yyyy').format(createdAt);

                          // Initials for avatar
                          final parts = name.split(' ').where((s) => s.isNotEmpty).toList();
                          final initials = parts.isNotEmpty
                              ? (parts.first[0] + (parts.length > 1 ? parts.last[0] : '')).toUpperCase()
                              : 'U';

                          return Container(
                            padding: const EdgeInsets.all(14),
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              color: AppColors.card.withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundColor: AppColors.gold.withValues(alpha: 0.15),
                                      child: Text(initials, style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12)),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(name, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                          if (isVerified)
                                            const Row(
                                              children: [
                                                Icon(Icons.verified, color: AppColors.success, size: 10),
                                                SizedBox(width: 2),
                                                Text('Verified Purchase', style: TextStyle(color: AppColors.success, fontSize: 9, fontWeight: FontWeight.bold)),
                                              ],
                                            ),
                                        ],
                                      ),
                                    ),
                                    Text(dateStr, style: const TextStyle(color: AppColors.muted, fontSize: 10)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: List.generate(
                                    5,
                                    (i) => Icon(
                                      i < rating.floor() ? Icons.star : Icons.star_border,
                                      color: AppColors.gold,
                                      size: 13,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                if (title.isNotEmpty)
                                  Text(title, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 4),
                                Text(comment, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                              ],
                            ),
                          );
                        },
                      ),
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Text(
                            'ⓘ Note: Lenses will be added after selecting power and type',
                            style: TextStyle(color: Colors.white30, fontSize: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 100), // space for sticky bottom
              ],
            ),
          ),
        // Sticky bottom CTA bar
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            color: AppColors.card,
            border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
          ),
          child: SafeArea(
            top: false,
            child: Align(
              alignment: Alignment.bottomCenter,
              heightFactor: 1.0,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 600),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      // Price & Offer Column
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_customPriceOverride == null && !isContactLenses && p.memberPrice != null && p.nonMemberPrice != null) ...[
                            Row(
                              children: [
                                Text(
                                  '₹${p.memberPrice!.toInt()}',
                                  style: const TextStyle(color: AppColors.gold, fontSize: 18, fontWeight: FontWeight.w900),
                                ),
                                const SizedBox(width: 4),
                                const Text('(Member)', style: TextStyle(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(
                                  '₹${p.nonMemberPrice!.toInt()}',
                                  style: const TextStyle(color: AppColors.white, fontSize: 14, fontWeight: FontWeight.w900),
                                ),
                                const SizedBox(width: 4),
                                const Text('(Non-Member)', style: TextStyle(color: Colors.white38, fontSize: 9)),
                              ],
                            ),
                          ] else ...[
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text(
                                  '₹${displayPrice.toInt()}',
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 22,
                                  ),
                                ),
                                if (_customPriceOverride == null) ...[
                                  const SizedBox(width: 6),
                                  Text(
                                    '₹${p.originalPrice.toInt()}',
                                    style: const TextStyle(
                                      color: Colors.white38,
                                      decoration: TextDecoration.lineThrough,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            if (_customPriceOverride == null) ...[
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: AppColors.gold.withValues(alpha: 0.15),
                                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.3), width: 0.8),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '${((p.originalPrice - p.sellingPrice) / p.originalPrice * 100).round()}% OFF',
                                  style: const TextStyle(
                                    color: AppColors.gold,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ],
                      ),
                      const SizedBox(width: 16),
                      // Buttons
                      Expanded(
                        child: Row(
                          children: [
                            if (isContactLenses || isReadingGlasses) ...[
                              // ADD TO CART
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: _addToCart,
                                  style: OutlinedButton.styleFrom(
                                    backgroundColor: Colors.black,
                                    foregroundColor: AppColors.gold,
                                    side: const BorderSide(color: AppColors.gold, width: 1.2),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    minimumSize: Size.zero,
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.shopping_bag_outlined, color: AppColors.gold, size: 16),
                                      SizedBox(width: 6),
                                      Text(
                                        'ADD TO CART',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 11,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              // BUY NOW
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _buyNow,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.gold,
                                    foregroundColor: Colors.black,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    minimumSize: Size.zero,
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.flash_on, color: Colors.black, size: 16),
                                      SizedBox(width: 6),
                                      Text(
                                        'BUY NOW',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 11,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ] else ...[
                              // Standard frame
                              if (p.sellAsFrame)
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: _addToCart,
                                    style: OutlinedButton.styleFrom(
                                      backgroundColor: Colors.black,
                                      foregroundColor: AppColors.gold,
                                      side: const BorderSide(color: AppColors.gold, width: 1.2),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      minimumSize: Size.zero,
                                    ),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.shopping_bag_outlined, color: AppColors.gold, size: 16),
                                        SizedBox(width: 6),
                                        Text(
                                          'ADD TO CART',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 11,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              if (p.sellAsFrame && p.sellWithLens) const SizedBox(width: 8),
                              if (p.sellWithLens)
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: _buyWithLens,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.gold,
                                      foregroundColor: Colors.black,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      minimumSize: Size.zero,
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        SizedBox(
                                          width: 18,
                                          height: 12,
                                          child: CustomPaint(
                                            painter: _SizeGlassesPainter(color: Colors.black),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        const Text(
                                          'BUY WITH LENS',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 11,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    } catch (e, stack) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          title: const Text('Error Rendering Details'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: SingleChildScrollView(
              child: Text(
                'Rendering Error: $e\n\n$stack',
                style: const TextStyle(color: AppColors.error, fontSize: 13),
              ),
            ),
          ),
        ),
      );
    }
  }

  void _addToCart() async {
    if (isContactLenses && _selectedContactPower == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please select a contact lens power first.'),
        backgroundColor: AppColors.error,
      ));
      return;
    }
    if (isReadingGlasses && _selectedReadingPower == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please select a reading power first.'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final payload = {
        'productId': p.id,
        'qty': 1,
        'color': selectedColorName,
      };

      if (isContactLenses) {
        payload['lens'] = {
          'lensType': 'Contact Lens',
          'lensSubType': p.contactDisposableType ?? 'Monthly',
          'lensQuality': _selectedContactPower!,
          'framePrice': 0.0,
          'lensPrice': displayPrice,
          'fittingCharge': 0.0,
        };
      } else if (isReadingGlasses) {
        payload['lens'] = {
          'lensType': 'Reading Lens',
          'lensSubType': _selectedReadingPower!,
          'lensQuality': 'Standard Reading',
        };
      } else {
        payload['framePrice'] = p.sellingPrice;
      }

      await api.addToCart(payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Added to cart!'),
          backgroundColor: AppColors.gold,
        ));
        _loadCartCount();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  void _buyNow() async {
    if (isContactLenses && _selectedContactPower == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please select a contact lens power first.'),
        backgroundColor: AppColors.error,
      ));
      return;
    }
    if (isReadingGlasses && _selectedReadingPower == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please select a reading power first.'),
        backgroundColor: AppColors.error,
      ));
      return;
    }

    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final payload = {
        'productId': p.id,
        'qty': 1,
        'color': selectedColorName,
      };

      if (isContactLenses) {
        payload['lens'] = {
          'lensType': 'Contact Lens',
          'lensSubType': p.contactDisposableType ?? 'Monthly',
          'lensQuality': _selectedContactPower!,
          'framePrice': 0.0,
          'lensPrice': displayPrice,
          'fittingCharge': 0.0,
        };
      } else if (isReadingGlasses) {
        payload['lens'] = {
          'lensType': 'Reading Lens',
          'lensSubType': _selectedReadingPower!,
          'lensQuality': 'Standard Reading',
        };
      }

      await api.addToCart(payload);

      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CartScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed: $e'),
          backgroundColor: AppColors.error,
        ));
      }
    }
  }

  void _buyWithLens() {
    final wizardState = LensWizardState();
    wizardState.setProduct(p, selectedColorName);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChangeNotifierProvider.value(
          value: wizardState,
          child: const LensTypeScreen(),
        ),
      ),
    );
  }

  Color _parseHexColor(String hexStr) {
    try {
      String cleanHex = hexStr.replaceFirst('#', '');
      if (cleanHex.length == 3) {
        cleanHex = cleanHex.split('').map((c) => '$c$c').join();
      }
      if (cleanHex.length != 6 && cleanHex.length != 8) {
        return Colors.transparent;
      }
      if (cleanHex.length == 6) {
        cleanHex = 'FF$cleanHex';
      }
      return Color(int.parse(cleanHex, radix: 16));
    } catch (_) {
      return Colors.transparent;
    }
  }

  Widget _buildSizeCard(String sizeName, String rangeText, String descText) {
    final isSelected = _selectedSize == sizeName;
    final isRecommended = recommendedSize == sizeName;

    String displayTitle = sizeName.toUpperCase();
    String displayRange = rangeText;
    String displayDesc = descText;

    if (isKidsProduct) {
      if (sizeName == 'Small') {
        displayTitle = 'JUNIORS';
        displayRange = '5 – 8 years';
        displayDesc = 'Frame: Small';
      } else if (sizeName == 'Medium') {
        displayTitle = 'TWEENS';
        displayRange = '8 – 12 years';
        displayDesc = 'Frame: Medium';
      } else if (sizeName == 'Large') {
        displayTitle = 'TEENS';
        displayRange = '12 – 17 years';
        displayDesc = 'Frame: Large';
      }
    }

    return GestureDetector(
      onTap: () => setState(() => _selectedSize = sizeName),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
            decoration: BoxDecoration(
              color: AppColors.card,
              border: Border.all(
                color: isSelected ? AppColors.gold : AppColors.border,
                width: isSelected ? 1.5 : 1,
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isRecommended) const SizedBox(height: 4), // offset for top banner spacing
                Text(
                  displayTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                // Outline of glasses
                SizedBox(
                  width: 44,
                  height: 18,
                  child: CustomPaint(
                    painter: _SizeGlassesPainter(
                      color: isSelected ? AppColors.gold : Colors.white.withValues(alpha: 0.3),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  displayRange,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 2),
                Text(
                  displayDesc,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                    fontSize: 7.5,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          // Recommended Badge
          if (isRecommended)
            Positioned(
              top: -6,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Recommended',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 7,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ),
          // Selected Checkmark Badge
          if (isSelected)
            Positioned(
              top: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  color: AppColors.gold,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.black,
                  size: 8,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SizeGlassesPainter extends CustomPainter {
  final Color color;
  _SizeGlassesPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final w = size.width;
    final h = size.height;

    // Left Lens
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.12, h * 0.2, w * 0.32, h * 0.6),
        Radius.circular(h * 0.2),
      ),
      paint,
    );
    // Right Lens
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.56, h * 0.2, w * 0.32, h * 0.6),
        Radius.circular(h * 0.2),
      ),
      paint,
    );

    // Bridge
    canvas.drawLine(
      Offset(w * 0.44, h * 0.45),
      Offset(w * 0.56, h * 0.45),
      paint,
    );

    // Left joint extension
    canvas.drawLine(
      Offset(w * 0.12, h * 0.35),
      Offset(w * 0.04, h * 0.35),
      paint,
    );
    // Right joint extension
    canvas.drawLine(
      Offset(w * 0.88, h * 0.35),
      Offset(w * 0.96, h * 0.35),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _RatingPercentageRow extends StatelessWidget {
  final int stars;
  final int pct;
  const _RatingPercentageRow({required this.stars, required this.pct});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.5),
      child: Row(
        children: [
          Text('$stars', style: const TextStyle(color: AppColors.muted, fontSize: 11)),
          const SizedBox(width: 2),
          const Icon(Icons.star, color: AppColors.muted, size: 10),
          const SizedBox(width: 6),
          Expanded(
            child: Container(
              height: 6,
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(3)),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: pct / 100,
                child: Container(
                  decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(3)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 24,
            child: Text('$pct%', style: const TextStyle(color: AppColors.muted, fontSize: 10), textAlign: TextAlign.right),
          ),
        ],
      ),
    );
  }
}

// AI Chat Bottom Sheet Content
class _AiChatBottomSheetContent extends StatefulWidget {
  final String sku;
  final double price;
  final int frameWidth;
  final int lensWidth;
  final int bridgeWidth;
  final int templeLength;

  const _AiChatBottomSheetContent({
    required this.sku,
    required this.price,
    required this.frameWidth,
    required this.lensWidth,
    required this.bridgeWidth,
    required this.templeLength,
  });

  @override
  State<_AiChatBottomSheetContent> createState() => _AiChatBottomSheetContentState();
}

class _AiChatBottomSheetContentState extends State<_AiChatBottomSheetContent> {
  final List<Map<String, String>> _messages = [
    {
      'sender': 'bot',
      'text': 'Hello! Welcome to EyeGlaze. I am your AI assistant. How can I help you choose the perfect frames today?'
    }
  ];
  final _chatInputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _isTyping = false;

  void _sendMessage() {
    final text = _chatInputCtrl.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'sender': 'user', 'text': text});
      _chatInputCtrl.clear();
      _isTyping = true;
    });
    _scrollToBottom();

    // Answer logic
    Future.delayed(const Duration(milliseconds: 1000), () {
      if (!mounted) return;
      final val = text.toLowerCase();
      String response = 'This frame (${widget.sku}) is highly compatible with prescription, blue cut, and progressive lenses. We offer single-vision, bifocal, and progressive options starting from ₹699.';

      if (val.contains('price') || val.contains('cost') || val.contains('rate')) {
        response = 'The frame starts at ₹${widget.price.toInt()}. With prescription lenses, packages start from ₹699.';
      } else if (val.contains('size') || val.contains('fit') || val.contains('measure') || val.contains('dimension')) {
        response = 'This frame has a total width of ${widget.frameWidth}mm, lens width of ${widget.lensWidth}mm, bridge width of ${widget.bridgeWidth}mm, and temple length of ${widget.templeLength}mm. It fits most faces comfortably!';
      } else if (val.contains('delivery') || val.contains('ship') || val.contains('time') || val.contains('days')) {
        response = 'We offer Fast Delivery in 2-4 days. Shipping is ₹99.';
      }

      setState(() {
        _messages.add({'sender': 'bot', 'text': response});
        _isTyping = false;
      });
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _chatInputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return Container(
      height: mq.size.height * 0.75,
      padding: EdgeInsets.only(bottom: mq.viewInsets.bottom),
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        children: [
          // Header handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
          ),
          // Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppColors.gold, size: 20),
                const SizedBox(width: 8),
                const Text('AI assistant', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.muted, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.border, height: 1),
          // Messages list
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, idx) {
                final msg = _messages[idx];
                final isBot = msg['sender'] == 'bot';
                return Align(
                  alignment: isBot ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    constraints: BoxConstraints(maxWidth: mq.size.width * 0.75),
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: isBot ? AppColors.card : AppColors.gold,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(12),
                        topRight: const Radius.circular(12),
                        bottomLeft: isBot ? const Radius.circular(0) : const Radius.circular(12),
                        bottomRight: isBot ? const Radius.circular(12) : const Radius.circular(0),
                      ),
                    ),
                    child: Text(
                      msg['text'] ?? '',
                      style: TextStyle(color: isBot ? AppColors.white : Colors.black, fontSize: 13),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_isTyping)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 2),
                ),
              ),
            ),
          const Divider(color: AppColors.border, height: 1),
          // Input field
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _chatInputCtrl,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    onSubmitted: (_) => _sendMessage(),
                    decoration: const InputDecoration(
                      hintText: 'Ask about price, size, fit, delivery...',
                      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: AppColors.gold),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Unused widgets removed

class _FrameSpecs extends StatelessWidget {
  final double frameWidth;
  final double lensWidth;
  final double bridgeWidth;
  final double templeLength;

  const _FrameSpecs({
    required this.frameWidth,
    required this.lensWidth,
    required this.bridgeWidth,
    required this.templeLength,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0E0E0E),
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Expanded(child: _buildSpecItem(
              painter: _FrameWidthPainter(),
              label: 'FRAME WIDTH',
              value: '${frameWidth.toInt()} mm',
            )),
            _buildDivider(),
            Expanded(child: _buildSpecItem(
              painter: _LensWidthPainter(),
              label: 'LENS WIDTH',
              value: '${lensWidth.toInt()} mm',
            )),
            _buildDivider(),
            Expanded(child: _buildSpecItem(
              painter: _BridgeWidthPainter(),
              label: 'BRIDGE',
              value: '${bridgeWidth.toInt()} mm',
            )),
            _buildDivider(),
            Expanded(child: _buildSpecItem(
              painter: _TempleLengthPainter(),
              label: 'TEMPLE',
              value: '${templeLength.toInt()} mm',
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      width: 1,
      color: AppColors.border,
    );
  }

  Widget _buildSpecItem({required CustomPainter painter, required String label, required String value}) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          width: 36,
          height: 18,
          child: CustomPaint(painter: painter),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white38,
            fontSize: 7.5,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.white,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _FrameWidthPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final w = size.width;
    final h = size.height;

    // Left Lens
    canvas.drawCircle(Offset(w * 0.32, h * 0.5), h * 0.35, paint);
    // Right Lens
    canvas.drawCircle(Offset(w * 0.68, h * 0.5), h * 0.35, paint);

    // Bridge
    canvas.drawLine(Offset(w * 0.42, h * 0.5), Offset(w * 0.58, h * 0.5), paint);

    // Left end piece
    canvas.drawLine(Offset(w * 0.20, h * 0.5), Offset(0, h * 0.5), paint);
    // Right end piece
    canvas.drawLine(Offset(w * 0.80, h * 0.5), Offset(w, h * 0.5), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LensWidthPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final w = size.width;
    final h = size.height;

    final path = Path();
    path.moveTo(w * 0.5, h * 0.1);
    // Top right arch
    path.quadraticBezierTo(w * 0.75, h * 0.1, w * 0.8, h * 0.2);
    // Right side down
    path.quadraticBezierTo(w * 0.8, h * 0.6, w * 0.5, h * 0.9);
    // Left side down
    path.quadraticBezierTo(w * 0.2, h * 0.6, w * 0.2, h * 0.2);
    // Top left arch
    path.quadraticBezierTo(w * 0.25, h * 0.1, w * 0.5, h * 0.1);

    canvas.drawPath(path, paint);

    // Checkmark inside shield
    final checkPaint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    final checkPath = Path();
    checkPath.moveTo(w * 0.42, h * 0.5);
    checkPath.lineTo(w * 0.48, h * 0.58);
    checkPath.lineTo(w * 0.58, h * 0.4);
    canvas.drawPath(checkPath, checkPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _BridgeWidthPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final w = size.width;
    final h = size.height;

    // Left horizontal line
    canvas.drawLine(Offset(w * 0.1, h * 0.6), Offset(w * 0.35, h * 0.6), paint);
    // Right horizontal line
    canvas.drawLine(Offset(w * 0.65, h * 0.6), Offset(w * 0.9, h * 0.6), paint);

    // Bridge arch: Bezier curve
    final path = Path();
    path.moveTo(w * 0.35, h * 0.6);
    path.cubicTo(w * 0.42, h * 0.25, w * 0.58, h * 0.25, w * 0.65, h * 0.6);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _TempleLengthPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    final w = size.width;
    final h = size.height;

    final path = Path();
    path.moveTo(w * 0.15, h * 0.5);
    path.lineTo(w * 0.75, h * 0.5);
    path.quadraticBezierTo(w * 0.85, h * 0.5, w * 0.88, h * 0.8);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _FrameDetails extends StatelessWidget {
  final Product product;
  const _FrameDetails({required this.product});

  @override
  Widget build(BuildContext context) {
    final p = product;
    final frame = p.frame;
    final compatible = p.compatible;

    final frameShape = p.frameShape;
    final frameWeight = p.frameWeight;
    final countryOfOrigin = p.countryOfOrigin;
    final manufacturer = p.manufacturer;
    final warranty = p.warranty;
    final frameType = p.frameType ?? frame?.type;
    final material = p.material ?? frame?.material;

    final List<MapEntry<String, String>> specs = [];
    if (frameType != null && frameType.isNotEmpty) specs.add(MapEntry('Frame Type', frameType));
    if (frameShape != null && frameShape.isNotEmpty) specs.add(MapEntry('Frame Shape', frameShape));
    if (material != null && material.isNotEmpty) specs.add(MapEntry('Material', material));
    if (frameWeight != null && frameWeight.isNotEmpty) specs.add(MapEntry('Weight', frameWeight));
    if (countryOfOrigin != null && countryOfOrigin.isNotEmpty) specs.add(MapEntry('Origin', countryOfOrigin));
    if (manufacturer != null && manufacturer.isNotEmpty) specs.add(MapEntry('Manufacturer', manufacturer));
    if (warranty != null && warranty.isNotEmpty) specs.add(MapEntry('Warranty', warranty));

    // build a 2-column layout using pairs of specs
    final List<Widget> specRows = [];
    for (int i = 0; i < specs.length; i += 2) {
      final left = specs[i];
      final right = (i + 1 < specs.length) ? specs[i + 1] : null;

      specRows.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Row(
            children: [
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${left.key}: ', style: AppTextStyles.muted.copyWith(fontSize: 11)),
                    Expanded(
                      child: Text(
                        left.value,
                        style: const TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.right,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              if (right != null) ...[
                const SizedBox(width: 16),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${right.key}: ', style: AppTextStyles.muted.copyWith(fontSize: 11)),
                      Expanded(
                        child: Text(
                          right.value,
                          style: const TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.right,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ] else
                const Expanded(child: SizedBox()),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, color: AppColors.gold, size: 18),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Frame Details & Specifications',
                  style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 15),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: AppColors.card,
                      title: const Text('Frame Specifications', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      content: const Text(
                        'Handcrafted premium frames, double-reinforced hinges, organic coatings, premium materials.',
                        style: TextStyle(color: Colors.white70),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('CLOSE', style: TextStyle(color: AppColors.gold)),
                        ),
                      ],
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.gold, width: 1.0),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'VIEW DETAILS',
                  style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 0.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...specRows,
          if (frame != null && frame.featureTags.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: frame.featureTags
                  .map((tag) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A1A1C),
                          border: Border.all(color: AppColors.border),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              '✔ ',
                              style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              tag,
                              style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ))
                  .toList(),
            ),
          ],
          if (compatible != null) ...[
            const SizedBox(height: 12),
            const Divider(color: AppColors.border),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.check_circle_outline, color: AppColors.success, size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Compatible with ${[
                      if (compatible.prescription) 'Prescription Lenses',
                      if (compatible.bluecut) 'Blue Cut',
                      if (compatible.zeropower) 'Zero Power',
                      if (compatible.progressive) 'Progressive',
                    ].join(' • ')}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _SimilarProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;

  const _SimilarProductCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final discount = product.originalPrice > product.sellingPrice
        ? ((product.originalPrice - product.sellingPrice) / product.originalPrice * 100).round()
        : 0;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
                ),
                width: double.infinity,
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                  child: product.images.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: AppConfig.resolveImageUrl(product.images.first),
                          fit: BoxFit.contain,
                          placeholder: (context, url) => const Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.5),
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
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.sku, style: const TextStyle(color: AppColors.muted, fontSize: 9)),
                  Text(
                    product.name,
                    style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.bold),
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
                    children: [
                      Text('₹${product.sellingPrice.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 14)),
                      const SizedBox(width: 4),
                      Text('₹${product.originalPrice.toInt()}', style: const TextStyle(color: AppColors.muted, decoration: TextDecoration.lineThrough, fontSize: 10)),
                      const Spacer(),
                      if (discount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.gold.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
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
