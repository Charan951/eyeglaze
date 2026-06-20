import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme.dart';
import '../../core/app_config.dart';
import '../../models/product.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import 'product_detail_screen.dart';
import '../home/home_screen.dart';

class WishlistScreen extends StatefulWidget {
  final bool isStandalonePage;
  const WishlistScreen({super.key, this.isStandalonePage = true});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  List<Product> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  Future<void> _loadWishlist() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final res = await api.getWishlist();
      final list = (res['wishlist'] ?? []) as List;
      if (mounted) {
        setState(() {
          _items = list.map((item) => Product.fromJson(item)).toList();
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _items = []);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _removeItem(String productId) async {
    // Optimistic update
    setState(() {
      _items.removeWhere((item) => item.id == productId);
    });

    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      await api.toggleWishlist(productId);
    } catch (_) {
      // Re-load on failure
      _loadWishlist();
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = _loading
        ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
        : _items.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        '❤️',
                        style: TextStyle(fontSize: 60),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Your wishlist is empty',
                        style: AppTextStyles.heading3,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Save frames you love here to easily find them later and add them to your collection.',
                        style: AppTextStyles.muted,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: 200,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () {
                            if (widget.isStandalonePage) {
                              Navigator.pop(context);
                            } else {
                              // If embedded in tab, let user search
                              // We can't change tabs from here directly unless we pass callback,
                              // but pop/popUntil is a safe default.
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'EXPLORE CATALOG',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : RefreshIndicator(
                color: AppColors.gold,
                onRefresh: _loadWishlist,
                child: GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.62,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: _items.length,
                  itemBuilder: (context, i) {
                    final item = _items[i];
                    final discount = ((item.originalPrice - item.sellingPrice) / item.originalPrice * 100).round();
                    return _WishlistCard(
                      product: item,
                      discount: discount,
                      onRemove: () => _removeItem(item.id),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ProductDetailScreen(product: item),
                          ),
                        ).then((_) {
                          _loadWishlist();
                          HomeScreen.state?.loadCartCount();
                        });
                      },
                    );
                  },
                ),
              );

    if (widget.isStandalonePage) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          title: const Text('My Wishlist', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: body,
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('My Wishlist', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.bold)),
        automaticallyImplyLeading: false,
      ),
      body: body,
    );
  }
}

class _WishlistCard extends StatelessWidget {
  final Product product;
  final int discount;
  final VoidCallback onRemove;
  final VoidCallback onTap;

  const _WishlistCard({
    required this.product,
    required this.discount,
    required this.onRemove,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
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
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
                    ),
                    width: double.infinity,
                    height: double.infinity,
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
                  if (product.isBestseller)
                    Positioned(
                      top: 8, left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)),
                        child: const Text('BESTSELLER', style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  Positioned(
                    top: 4, right: 4,
                    child: GestureDetector(
                      onTap: onRemove,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(color: Colors.black26, shape: BoxShape.circle),
                        child: const Icon(Icons.delete, color: AppColors.error, size: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.sku, style: const TextStyle(color: AppColors.muted, fontSize: 9)),
                  Text(product.name, style: const TextStyle(color: AppColors.white, fontSize: 12, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text('₹${product.sellingPrice.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(width: 4),
                      Text('₹${product.originalPrice.toInt()}', style: const TextStyle(color: AppColors.muted, decoration: TextDecoration.lineThrough, fontSize: 10)),
                      const Spacer(),
                      if (discount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4)),
                          child: Text('$discount%', style: const TextStyle(color: AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold)),
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
