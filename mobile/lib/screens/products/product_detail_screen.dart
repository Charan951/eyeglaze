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
import '../../widgets/trust_strip.dart';
import '../../widgets/lens_wizard_state.dart';
import '../lens/lens_type_screen.dart';
import '../../widgets/responsive_container.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _selectedColorIdx = 0;
  int _currentImage = 0;

  // Wishlist and Reviews State
  bool _isInWishlist = false;
  double _rating = 0;
  int _reviewCount = 0;
  List<dynamic> _reviews = [];

  // Review Form Controllers
  final _reviewNameCtrl = TextEditingController();
  final _reviewTitleCtrl = TextEditingController();
  final _reviewCommentCtrl = TextEditingController();
  int _newReviewRating = 5;
  bool _showReviewForm = false;
  bool _reviewSuccess = false;

  Product get p => widget.product;

  List<String> get imagesList {
    if (p.images.isNotEmpty) {
      return p.images;
    }
    return [
      'https://images.lenskart.com/media/catalog/product/placeholder-round-front.jpg',
      'https://images.lenskart.com/media/catalog/product/placeholder-round-left.jpg',
      'https://images.lenskart.com/media/catalog/product/placeholder-round-right.jpg',
      'https://images.lenskart.com/media/catalog/product/placeholder-round-top.jpg',
    ];
  }

  String get selectedColorName =>
      p.colors.isNotEmpty ? p.colors[_selectedColorIdx].name : 'Default';

  @override
  void initState() {
    super.initState();
    _rating = p.rating;
    _reviewCount = p.reviewCount;
    _reviews = _getMockReviews();
    _checkWishlistStatus();
    _loadProductDetails();
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
    final auth = context.read<AuthService>();
    if (!auth.isLoggedIn) return;
    try {
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
            final dynamic ratingVal = prodData['rating'];
            if (ratingVal is num) {
              _rating = ratingVal.toDouble();
            } else if (ratingVal is String) {
              _rating = double.tryParse(ratingVal) ?? p.rating;
            }

            final dynamic countVal = prodData['reviewCount'];
            if (countVal is num) {
              _reviewCount = countVal.toInt();
            } else if (countVal is String) {
              _reviewCount = int.tryParse(countVal) ?? p.reviewCount;
            }
          }

          if (backendReviews.isNotEmpty) {
            _reviews = backendReviews;
          } else {
            _reviews = _getMockReviews();
          }
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _rating = p.rating;
          _reviewCount = p.reviewCount;
          _reviews = _getMockReviews();
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

  @override
  Widget build(BuildContext context) {
    try {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
          title: const EyeGlazeLogo(),
          centerTitle: true,
          actions: [
            IconButton(icon: const Icon(Icons.search, color: AppColors.white), onPressed: () {}),
            IconButton(
              icon: Icon(_isInWishlist ? Icons.favorite : Icons.favorite_outline, color: _isInWishlist ? AppColors.gold : AppColors.white),
              onPressed: _toggleWishlist,
            ),
            Stack(
              children: [
                IconButton(icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.white), onPressed: () {}),
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
                    child: const Center(child: Text('0', style: TextStyle(color: Colors.white, fontSize: 8))),
                  ),
                ),
              ],
            ),
          ],
        ),
        body: ResponsiveContainer(
          maxWidth: 600,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image carousel
                _ImageCarousel(product: p, imagesList: imagesList, currentIndex: _currentImage, onChanged: (i) => setState(() => _currentImage = i)),
                // Thumbnail strip
                _ThumbnailStrip(imagesList: imagesList, selected: _currentImage, onTap: (i) => setState(() => _currentImage = i)),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Product name
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(text: p.sku, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                            const TextSpan(text: '  |  ', style: TextStyle(color: AppColors.muted, fontSize: 18)),
                            TextSpan(text: p.name, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Rating
                      Row(
                        children: [
                          Row(children: List.generate(5, (i) => Icon(i < _rating.floor() ? Icons.star : (i < _rating ? Icons.star_half : Icons.star_outline), color: AppColors.gold, size: 16))),
                          const SizedBox(width: 6),
                          Text(_rating.toStringAsFixed(1), style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
                          Text('  $_reviewCount reviews', style: AppTextStyles.muted),
                          const Spacer(),
                          Text('${p.soldCount}+ bought this week', style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                        ],
                      ),
                      const SizedBox(height: 10),
                      // Share / Wishlist
                      Row(
                        children: [
                          TextButton.icon(
                            icon: const Icon(Icons.share, color: AppColors.muted, size: 16),
                            label: const Text('Share', style: TextStyle(color: AppColors.muted)),
                            onPressed: _shareProduct,
                          ),
                          const SizedBox(width: 8),
                          TextButton.icon(
                            icon: Icon(_isInWishlist ? Icons.favorite : Icons.favorite_outline, color: _isInWishlist ? AppColors.gold : AppColors.muted, size: 16),
                            label: Text(_isInWishlist ? 'Wishlisted' : 'Wishlist', style: TextStyle(color: _isInWishlist ? AppColors.gold : AppColors.muted)),
                            onPressed: _toggleWishlist,
                          ),
                        ],
                      ),
                      // Price block
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Frame Starting', style: AppTextStyles.muted),
                            const SizedBox(height: 6),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text('₹${p.sellingPrice.toInt()}', style: const TextStyle(color: AppColors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                                const SizedBox(width: 10),
                                Text('₹${p.originalPrice.toInt()}', style: const TextStyle(color: AppColors.muted, fontSize: 16, decoration: TextDecoration.lineThrough)),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(6)),
                                  child: const Text('50% OFF', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.local_shipping_outlined, color: AppColors.gold, size: 16),
                                        SizedBox(width: 6),
                                        Expanded(child: Text('Fast Delivery\n2-4 Days', style: TextStyle(color: AppColors.white, fontSize: 11))),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.currency_rupee, color: AppColors.gold, size: 16),
                                        SizedBox(width: 6),
                                        Expanded(child: Text('Just ₹99\nDelivery Charge', style: TextStyle(color: AppColors.white, fontSize: 11))),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Color selector
                      Text('Select Color: $selectedColorName', style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 10),
                      if (p.colors.isNotEmpty)
                        Wrap(
                          spacing: 10,
                          children: p.colors.asMap().entries.map((e) {
                            final isSelected = e.key == _selectedColorIdx;
                            final color = e.value;
                            return GestureDetector(
                              onTap: () => setState(() => _selectedColorIdx = e.key),
                              child: Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(int.parse(color.hex.replaceFirst('#', 'FF'), radix: 16)),
                                  border: Border.all(color: isSelected ? AppColors.gold : AppColors.border, width: isSelected ? 2.5 : 1),
                                ),
                                child: isSelected ? const Icon(Icons.check, color: Colors.white, size: 16) : null,
                              ),
                            );
                          }).toList(),
                        ),
                      const SizedBox(height: 16),
                      // Specs
                      if (p.frame != null) _FrameSpecs(frame: p.frame!),
                      const SizedBox(height: 16),
                      // Frame details card
                      if (p.frame != null) _FrameDetails(frame: p.frame!, compatible: p.compatible),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
                const TrustStrip(),
                // AI help banner
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome, color: AppColors.gold, size: 22),
                        const SizedBox(width: 10),
                        const Expanded(child: Text('Need Help? Chat with our AI Assistant', style: TextStyle(color: AppColors.white, fontSize: 13))),
                        GestureDetector(
                          onTap: _openAiChat,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(border: Border.all(color: AppColors.gold), borderRadius: BorderRadius.circular(8)),
                            child: const Text('CHAT NOW', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ),
                      ],
                    ),
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
                    ],
                  ),
                ),

                const SizedBox(height: 100), // space for sticky bottom
              ],
            ),
          ),
        ),
        // Sticky bottom CTA bar
        bottomNavigationBar: ResponsiveContainer(
          maxWidth: 600,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: AppColors.card,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('₹${p.sellingPrice.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                    const Text('50% OFF', style: TextStyle(color: AppColors.gold, fontSize: 11)),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _addToCart,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.white,
                      side: const BorderSide(color: AppColors.gold),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('ADD TO CART', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _buyWithLens,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('BUY WITH LENS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
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
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      await api.addToCart({
        'productId': p.id,
        'qty': 1,
        'color': selectedColorName,
        'framePrice': p.sellingPrice,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Added to cart!'),
          backgroundColor: AppColors.gold,
        ));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
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

// Sub components for original structure
class _ImageCarousel extends StatelessWidget {
  final Product product;
  final List<String> imagesList;
  final int currentIndex;
  final Function(int) onChanged;

  const _ImageCarousel({
    required this.product,
    required this.imagesList,
    required this.currentIndex,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final showTryOn = currentIndex == imagesList.length;
    return Stack(
      children: [
        Container(
          height: 260,
          color: AppColors.card,
          child: Center(
            child: showTryOn
                ? const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.face_retouching_natural, color: AppColors.gold, size: 80),
                      SizedBox(height: 12),
                      Text('Virtual Try On (Not Configured)', style: TextStyle(color: AppColors.muted, fontSize: 13)),
                    ],
                  )
                : CachedNetworkImage(
                    imageUrl: AppConfig.resolveImageUrl(imagesList[currentIndex]),
                    fit: BoxFit.contain,
                    placeholder: (context, url) => const CircularProgressIndicator(color: AppColors.gold),
                    errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 80),
                  ),
          ),
        ),
        if (product.isBestseller)
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(6)),
              child: const Text('BESTSELLER', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
            ),
          ),
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: AppColors.card.withValues(alpha: 0.9), border: Border.all(color: AppColors.gold), borderRadius: BorderRadius.circular(6)),
            child: const Text('360° VIEW', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 11)),
          ),
        ),
        Positioned(
          left: 8,
          bottom: 0,
          top: 0,
          child: Center(
            child: GestureDetector(
              onTap: () => onChanged(currentIndex > 0 ? currentIndex - 1 : imagesList.length),
              child: Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(color: AppColors.card, shape: BoxShape.circle),
                child: const Icon(Icons.chevron_left, color: AppColors.white, size: 20),
              ),
            ),
          ),
        ),
        Positioned(
          right: 8,
          bottom: 0,
          top: 0,
          child: Center(
            child: GestureDetector(
              onTap: () => onChanged(currentIndex < imagesList.length ? currentIndex + 1 : 0),
              child: Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(color: AppColors.card, shape: BoxShape.circle),
                child: const Icon(Icons.chevron_right, color: AppColors.white, size: 20),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ThumbnailStrip extends StatelessWidget {
  final List<String> imagesList;
  final int selected;
  final Function(int) onTap;

  const _ThumbnailStrip({
    required this.imagesList,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final totalCount = imagesList.length + 1;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: List.generate(totalCount, (i) {
          final isSelected = i == selected;
          final isTryOn = i == imagesList.length;
          return Expanded(
            child: GestureDetector(
              onTap: () => onTap(i),
              child: Container(
                margin: const EdgeInsets.only(right: 6),
                height: 50,
                decoration: BoxDecoration(
                  color: AppColors.card,
                  border: Border.all(color: isSelected ? AppColors.gold : AppColors.border, width: isSelected ? 2 : 1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: isTryOn
                    ? const Icon(Icons.face_retouching_natural, color: AppColors.gold, size: 24)
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: CachedNetworkImage(
                          imageUrl: AppConfig.resolveImageUrl(imagesList[i]),
                          fit: BoxFit.contain,
                          placeholder: (context, url) => const Center(
                            child: SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(color: AppColors.gold, strokeWidth: 1.5),
                            ),
                          ),
                          errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 16),
                        ),
                      ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _FrameSpecs extends StatelessWidget {
  final ProductFrame frame;
  const _FrameSpecs({required this.frame});

  @override
  Widget build(BuildContext context) {
    final specs = [
      {'icon': Icons.straighten, 'label': 'Frame Width', 'value': '${frame.width?.toInt() ?? 0}mm'},
      {'icon': Icons.remove_red_eye_outlined, 'label': 'Lens Width', 'value': '${frame.lensWidth?.toInt() ?? 0}mm'},
      {'icon': Icons.linear_scale, 'label': 'Bridge', 'value': '${frame.bridgeWidth?.toInt() ?? 0}mm'},
      {'icon': Icons.height, 'label': 'Temple', 'value': '${frame.templeLength?.toInt() ?? 0}mm'},
    ];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: specs
            .map((s) => Expanded(
                  child: Column(
                    children: [
                      Icon(s['icon'] as IconData, color: AppColors.gold, size: 18),
                      const SizedBox(height: 4),
                      Text(s['value'] as String, style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(s['label'] as String, style: const TextStyle(color: AppColors.muted, fontSize: 10), textAlign: TextAlign.center),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }
}

class _FrameDetails extends StatelessWidget {
  final ProductFrame frame;
  final ProductCompatible? compatible;
  const _FrameDetails({required this.frame, this.compatible});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.shield_outlined, color: AppColors.gold, size: 18),
              SizedBox(width: 8),
              Text('Frame Details', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 15)),
              Spacer(),
              Text('VIEW DETAILS', style: TextStyle(color: AppColors.gold, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 12),
          _DetailRow('Frame Type', frame.type ?? '-'),
          _DetailRow('Material', frame.material ?? '-'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: frame.featureTags
                .map((tag) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.background, border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(20)),
                      child: Text(tag, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                    ))
                .toList(),
          ),
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
                      if (compatible!.prescription) 'Prescription Lenses',
                      if (compatible!.bluecut) 'Blue Cut',
                      if (compatible!.zeropower) 'Zero Power',
                      if (compatible!.progressive) 'Progressive',
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

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          children: [
            Text('$label: ', style: AppTextStyles.muted),
            Text(value, style: const TextStyle(color: AppColors.white, fontSize: 13)),
          ],
        ),
      );
}
