import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import '../../core/theme.dart';
import '../../core/app_config.dart';
import '../../models/product.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/socket_service.dart';
import '../../services/cart_provider.dart';
import 'product_detail_screen.dart';
import '../../widgets/responsive_container.dart';

class ProductsScreen extends StatefulWidget {
  final String? category;
  final String? subCategory;
  final String? subSubCategory;
  final String? subSubSubCategory;
  final String? shape;
  final String? gender;
  final String? size;
  final String? tier;
  // The actual display name of whatever was tapped to get here (e.g. "1+1
  // offers"), passed straight through from the caller — matches the web app's
  // mobile app-bar title (Products.tsx `displayTitle`: subSubCategory name >
  // subCategory name > category name), rather than showing a raw category
  // slug like "eyeglasses".
  final String? initialTitle;
  const ProductsScreen({
    super.key,
    this.category,
    this.subCategory,
    this.subSubCategory,
    this.subSubSubCategory,
    this.shape,
    this.gender,
    this.size,
    this.tier,
    this.initialTitle,
  });

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _NestedChip {
  final String slug;
  final String name;
  // 'subSubCategory' (contact-lens first step) or 'subSubSubCategory'
  final String param;
  const _NestedChip({
    required this.slug,
    required this.name,
    required this.param,
  });
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<Product> _products = [];
  int? _totalItems;
  bool _loading = true;
  String? _selectedCategory;
  String? _selectedSubCategory;
  String? _selectedSubSubCategory;
  String? _selectedSubSubSubCategory;
  String? _selectedShape;
  String _selectedSort = 'newest';
  String? _selectedMaterial;
  String? _selectedSize;
  String? _selectedColor;
  String? _selectedGender;
  final _searchCtrl = TextEditingController();
  String _selectedTier = 'All';

  List<dynamic> _categoryTree = [];
  List<String> _categories = [
    'All',
    'Prescription',
    'Sunglasses',
    'Blue Cut',
    'Contact Lenses',
    'Kids',
  ];

  @override
  void initState() {
    super.initState();
    _selectedShape = widget.shape;
    _selectedSubCategory = (widget.subCategory != null && widget.subCategory!.isNotEmpty)
        ? widget.subCategory
        : null;
    _selectedSubSubCategory = (widget.subSubCategory != null && widget.subSubCategory!.isNotEmpty)
        ? widget.subSubCategory
        : null;
    _selectedSubSubSubCategory =
        (widget.subSubSubCategory != null && widget.subSubSubCategory!.isNotEmpty)
            ? widget.subSubSubCategory
            : null;
    // Some admin-created subcategories (e.g. Contact Lens > Solution & Accessories)
    // store gender as an empty string rather than omitting it — treat that the same
    // as "no gender filter" rather than a selected-but-blank value.
    _selectedGender = (widget.gender != null && widget.gender!.isNotEmpty) ? widget.gender : null;
    _selectedSize = widget.size;
    if (widget.tier != null) {
      _selectedTier = widget.tier!;
    }
    final passedCat = widget.category;
    if (passedCat == null) {
      _selectedCategory = 'All';
    } else {
      final clean = passedCat.toLowerCase().replaceAll('\n', ' ').trim();
      if (clean.contains('prescription')) {
        _selectedCategory = 'Prescription';
      } else if (clean.contains('sunglass')) {
        _selectedCategory = 'Sunglasses';
      } else if (clean.contains('blue')) {
        _selectedCategory = 'Blue Cut';
      } else if (clean.contains('contact')) {
        _selectedCategory = 'Contact Lenses';
      } else if (clean.contains('kid')) {
        _selectedCategory = 'Kids';
      } else {
        _selectedCategory = passedCat;
      }
    }
    _loadProducts();
    _loadCategories();

    // Connect socket listener
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final socketService = context.read<SocketService>();
        socketService.socket?.on('product_changed', _onProductChanged);
        socketService.socket?.on('category_changed', _onCategoryChanged);
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('product_changed', _onProductChanged);
      socketService.socket?.off('category_changed', _onCategoryChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onProductChanged(dynamic data) {
    if (kDebugMode) {
      print('Socket: product_changed event received: $data');
    }
    if (mounted) {
      _loadProducts();
    }
  }

  void _onCategoryChanged(dynamic data) {
    if (kDebugMode) {
      print('Socket: category_changed event received in ProductsScreen: $data');
    }
    if (mounted) {
      _loadCategories();
    }
  }

  Future<void> _loadCategories() async {
    try {
      final auth = context.read<AuthService>();
      final api = ApiService(auth);
      final list = await api.getCategories();
      if (list.isNotEmpty && mounted) {
        final names = list
            .map((c) => (c['name'] ?? '').toString())
            .where((n) => n.isNotEmpty)
            .toList();
        final cleanNames = names.map((name) {
          final lName = name.toLowerCase();
          if (lName == 'blue cut' ||
              lName == 'blue-cut' ||
              lName == 'blue_light')
            return 'Blue Cut';
          if (lName == 'prescription') return 'Prescription';
          if (lName == 'sunglasses') return 'Sunglasses';
          if (lName == 'contact-lenses' || lName == 'contact lenses')
            return 'Contact Lenses';
          if (lName == 'kids') return 'Kids';
          return name[0].toUpperCase() + name.substring(1);
        }).toList();

        setState(() {
          _categoryTree = list;
          _categories = ['All', ...cleanNames.toSet()];
        });
      }
    } catch (_) {}
  }

  String? _normalizeCategory(String? label) {
    if (label == null || label == 'All') return null;
    final clean = label.toLowerCase().replaceAll('\n', ' ').trim();
    if (clean.contains('prescription')) return 'prescription';
    if (clean.contains('sunglass')) return 'sunglasses';
    if (clean.contains('blue')) return 'blue_light';
    if (clean.contains('contact')) return 'contact_lenses';
    if (clean.contains('kid')) return 'kids';
    return clean;
  }

  List<Map<String, dynamic>> _asMapList(dynamic raw) {
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Map<String, dynamic>? _findChild(dynamic children, String key) {
    final needle = key.toLowerCase().trim();
    if (needle.isEmpty) return null;
    for (final child in _asMapList(children)) {
      final slug = (child['slug'] ?? '').toString().toLowerCase();
      final name = (child['name'] ?? '').toString().toLowerCase();
      if (slug == needle || name == needle) return child;
    }
    return null;
  }

  Map<String, dynamic>? _findActiveCategory() {
    final raw = (_selectedCategory ?? '').toLowerCase().trim();
    if (raw.isEmpty || raw == 'all') return null;
    final slug = (_normalizeCategory(_selectedCategory) ?? raw)
        .toLowerCase()
        .replaceAll('_', '-');
    for (final c in _asMapList(_categoryTree)) {
      final cSlug = (c['slug'] ?? '').toString().toLowerCase();
      final cName = (c['name'] ?? '').toString().toLowerCase();
      if (cSlug == raw ||
          cName == raw ||
          cSlug == slug ||
          cName == slug ||
          cSlug.replaceAll('_', '-') == slug) {
        return c;
      }
      if ((slug.contains('prescription') ||
              raw.contains('eyeglass') ||
              raw.contains('prescription')) &&
          (cSlug == 'eyeglasses' || cSlug == 'prescription')) {
        return c;
      }
      if ((slug.contains('contact') || raw.contains('contact')) &&
          cSlug.contains('contact')) {
        return c;
      }
      if ((slug.contains('blue') || raw.contains('blue')) &&
          (cSlug.contains('blue') || cSlug.contains('computer'))) {
        return c;
      }
    }
    return null;
  }

  Map<String, dynamic>? _findActiveSubCategory() {
    final subCat = _selectedSubCategory;
    if (subCat == null || subCat.isEmpty) return null;
    final fromCat = _findChild(_findActiveCategory()?['children'], subCat);
    if (fromCat != null) return fromCat;
    for (final cat in _asMapList(_categoryTree)) {
      final found = _findChild(cat['children'], subCat);
      if (found != null) return found;
    }
    return null;
  }

  // Mirrors frontend/src/pages/Products.tsx nested tab row:
  // Contact Lens drills SubCategory → SubSubCategory → SubSubSubCategory.
  // Every other category skips the brand (SubSubCategory) tier and shows
  // unique SubSubSubCategories merged across all brands under the subcategory.
  List<_NestedChip>? _nestedChips() {
    final subCat = _selectedSubCategory;
    if (subCat == null || subCat.isEmpty || _categoryTree.isEmpty) return null;

    final activeCat = _findActiveCategory();
    final categorySlug =
        ((activeCat?['slug'] ?? _selectedCategory) ?? '').toString().toLowerCase();
    final isContactLensCat = categorySlug.contains('contact');
    final hasSubSub = _selectedSubSubCategory != null &&
        _selectedSubSubCategory!.isNotEmpty;

    if (hasSubSub && !isContactLensCat) return null;

    final activeSub = _findActiveSubCategory();
    if (activeSub == null) return null;

    if (isContactLensCat) {
      if (hasSubSub) {
        final activeSubSub =
            _findChild(activeSub['children'], _selectedSubSubCategory!);
        final children = _asMapList(activeSubSub?['children']);
        if (children.isEmpty) return null;
        return [
          const _NestedChip(slug: '', name: 'All', param: 'subSubSubCategory'),
          ...children.map(
            (c) => _NestedChip(
              slug: (c['slug'] ?? '').toString().toLowerCase(),
              name: (c['name'] ?? c['slug'] ?? '').toString(),
              param: 'subSubSubCategory',
            ),
          ),
        ];
      }
      final children = _asMapList(activeSub['children']);
      if (children.isEmpty) return null;
      return [
        const _NestedChip(slug: '', name: 'All', param: 'subSubCategory'),
        ...children.map(
          (c) => _NestedChip(
            slug: (c['slug'] ?? '').toString().toLowerCase(),
            name: (c['name'] ?? c['slug'] ?? '').toString(),
            param: 'subSubCategory',
          ),
        ),
      ];
    }

    final seen = <String>{};
    final children = <Map<String, dynamic>>[];
    for (final brand in _asMapList(activeSub['children'])) {
      for (final tag in _asMapList(brand['children'])) {
        final tagSlug = (tag['slug'] ?? '').toString().toLowerCase();
        if (tagSlug.isNotEmpty && seen.add(tagSlug)) {
          children.add(tag);
        }
      }
    }
    if (children.isEmpty) return null;
    return [
      const _NestedChip(slug: '', name: 'All', param: 'subSubSubCategory'),
      ...children.map(
        (c) => _NestedChip(
          slug: (c['slug'] ?? '').toString().toLowerCase(),
          name: (c['name'] ?? c['slug'] ?? '').toString(),
          param: 'subSubSubCategory',
        ),
      ),
    ];
  }

  bool _isNestedChipSelected(_NestedChip chip) {
    if (chip.slug.isEmpty) {
      if (chip.param == 'subSubCategory') {
        return _selectedSubSubCategory == null ||
            _selectedSubSubCategory!.isEmpty;
      }
      return _selectedSubSubSubCategory == null ||
          _selectedSubSubSubCategory!.isEmpty;
    }
    if (chip.param == 'subSubCategory') {
      return (_selectedSubSubCategory ?? '').toLowerCase() == chip.slug;
    }
    return (_selectedSubSubSubCategory ?? '').toLowerCase() == chip.slug;
  }

  void _onNestedChipTap(_NestedChip chip) {
    setState(() {
      if (chip.param == 'subSubCategory') {
        _selectedSubSubCategory = chip.slug.isEmpty ? null : chip.slug;
        _selectedSubSubSubCategory = null;
      } else {
        _selectedSubSubSubCategory = chip.slug.isEmpty ? null : chip.slug;
      }
    });
    _loadProducts();
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? AppColors.gold : AppColors.card,
            border: Border.all(
              color: isSelected ? AppColors.gold : AppColors.border,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            strutStyle: const StrutStyle(
              fontSize: 13,
              height: 1.0,
              leading: 0,
              forceStrutHeight: true,
            ),
            style: TextStyle(
              color: isSelected ? Colors.white : AppColors.muted,
              fontSize: 13,
              height: 1.0,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final data = await api.getProducts(
        category: _normalizeCategory(_selectedCategory),
        subCategory: _selectedSubCategory,
        subSubCategory: _selectedSubSubCategory,
        subSubSubCategory: _selectedSubSubSubCategory,
        search: _searchCtrl.text.isEmpty ? null : _searchCtrl.text,
        sort: _selectedSort,
        shape: _selectedShape,
        material: _selectedMaterial,
        size: _selectedSize,
        color: _selectedColor,
        gender: _selectedGender,
        tier: _selectedTier == 'All' ? null : _selectedTier,
      );
      final list = (data['products'] ?? data['data'] ?? []) as List;
      setState(() {
        _products = list.map((p) => Product.fromJson(p)).toList();
        _totalItems = data['total'] is num ? (data['total'] as num).toInt() : _products.length;
      });
    } catch (e) {
      // show demo products
      setState(() {
        _products = _demoProducts();
        _totalItems = null;
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _FilterSheet(
        initialSort: _selectedSort,
        initialShape: _selectedShape,
        initialMaterial: _selectedMaterial,
        initialSize: _selectedSize,
        initialColor: _selectedColor,
        initialGender: _selectedGender,
        onApply: (sort, shape, material, size, color, gender) {
          setState(() {
            _selectedSort = sort;
            _selectedShape = shape;
            _selectedMaterial = material;
            _selectedSize = size;
            _selectedColor = color;
            _selectedGender = gender;
          });
          _loadProducts();
        },
      ),
    );
  }

  Future<void> _addToCart(Product product) async {
    try {
      final authService = context.read<AuthService>();
      if (!authService.isLoggedIn) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please login to add items to cart'),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.pushNamed(context, '/login');
        return;
      }
      final defaultColor = product.colors.isNotEmpty
          ? product.colors.first.name
          : 'Matte Black';
      await context.read<CartProvider>().addToCart({
        'productId': product.id,
        'qty': 1,
        'color': defaultColor,
        'framePrice': product.sellingPrice,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${product.name} added to cart!'),
            backgroundColor: AppColors.gold,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add to cart: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  List<Product> _demoProducts() => [
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
      colors: [ProductColor(name: 'Matte Black', hex: '#1A1A1A')],
      frame: ProductFrame(
        type: 'Square',
        material: 'TR90 Premium',
        width: 140,
        lensWidth: 54,
        bridgeWidth: 18,
        templeLength: 145,
      ),
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
      isBestseller: false,
      colors: [ProductColor(name: 'Black Gold', hex: '#C9A84C')],
      frame: ProductFrame(
        type: 'Clubmaster',
        material: 'Premium Metal',
        width: 138,
        lensWidth: 52,
        bridgeWidth: 18,
        templeLength: 145,
      ),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        scrolledUnderElevation: 0,
        // No more logo here — that duplicated the home page's app bar. Shows
        // the actual tapped item's name when known (mirrors the web app's
        // mobile app-bar `displayTitle`), falling back to the selected
        // category, then a generic "Products" label.
        title: Text(
          widget.initialTitle ??
              ((_selectedCategory == null || _selectedCategory == 'All')
                  ? 'Products'
                  : _selectedCategory!),
          style: const TextStyle(
            color: AppColors.white,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: true,
        // Explicit back icon so it matches the rest of the app (Icons.arrow_back)
        // instead of Flutter's platform-adaptive auto-back chevron on iOS.
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ResponsiveContainer(
        maxWidth: 900,
        child: Column(
          children: [
            // Item count — matches the web app's mobile "(N Items)" line
            // shown above the search bar.
            if (_totalItems != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '($_totalItems Item${_totalItems == 1 ? '' : 's'})',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: AppColors.white),
                decoration: InputDecoration(
                  hintText: 'Search glasses, sunglasses...',
                  prefixIcon: const Icon(Icons.search, color: AppColors.muted),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.tune, color: AppColors.gold),
                    onPressed: _showFilterSheet,
                  ),
                ),
                onSubmitted: (_) => _loadProducts(),
              ),
            ),
            // Nested category chips — same drill as web Products.tsx:
            // SubSubSubCategories under the current subcategory (Contact Lens
            // still shows SubSubCategories first). Falls back to top-level
            // category chips only when no subcategory is in play.
            Builder(
              builder: (context) {
                final nested = _nestedChips();
                final hasSubCategory = _selectedSubCategory != null &&
                    _selectedSubCategory!.isNotEmpty;
                if (nested != null && nested.isNotEmpty) {
                  return SizedBox(
                    height: 44,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: nested.length,
                      itemBuilder: (_, i) {
                        final chip = nested[i];
                        return _buildFilterChip(
                          label: chip.name,
                          isSelected: _isNestedChipSelected(chip),
                          onTap: () => _onNestedChipTap(chip),
                        );
                      },
                    ),
                  );
                }
                if (hasSubCategory) {
                  return const SizedBox.shrink();
                }
                return SizedBox(
                  height: 44,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _categories.length,
                    itemBuilder: (_, i) {
                      final cat = _categories[i];
                      final isSelected = cat == _selectedCategory;
                      return _buildFilterChip(
                        label: cat,
                        isSelected: isSelected,
                        onTap: () {
                          setState(() {
                            _selectedCategory = cat;
                            _selectedSubCategory = null;
                            _selectedSubSubCategory = null;
                            _selectedSubSubSubCategory = null;
                            _selectedShape = null;
                          });
                          _loadProducts();
                        },
                      );
                    },
                  ),
                );
              },
            ),
            const SizedBox(height: 8),
            // Product grid
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppColors.gold),
                    )
                  : _products.isEmpty
                  ? const Center(
                      child: Text(
                        'No products found',
                        style: AppTextStyles.muted,
                      ),
                    )
                  : LayoutBuilder(
                      builder: (context, constraints) {
                        final width = constraints.maxWidth;
                        final crossAxisCount = width > 750
                            ? 4
                            : (width > 500 ? 3 : 2);
                        return GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: crossAxisCount,
                                childAspectRatio: 0.62,
                                crossAxisSpacing: 10,
                                mainAxisSpacing: 10,
                              ),
                          itemCount: _products.length,
                          itemBuilder: (_, i) => _ProductCard(
                            product: _products[i],
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ProductDetailScreen(
                                    product: _products[i],
                                  ),
                                ),
                              );
                              if (mounted) {
                                _loadProducts();
                              }
                            },
                            onAddTap: () => _addToCart(_products[i]),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatefulWidget {
  final Product product;
  final VoidCallback onTap;
  final VoidCallback onAddTap;

  const _ProductCard({
    required this.product,
    required this.onTap,
    required this.onAddTap,
  });

  @override
  State<_ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<_ProductCard> {
  // Optimistic only — mobile doesn't track the full wishlist set on this
  // screen, so this reflects taps made here, not prior wishlist state.
  bool _isWishlisted = false;

  Future<void> _toggleWishlist() async {
    final authService = context.read<AuthService>();
    if (!authService.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to use your wishlist'),
          backgroundColor: AppColors.error,
        ),
      );
      Navigator.pushNamed(context, '/login');
      return;
    }
    setState(() => _isWishlisted = !_isWishlisted);
    try {
      final api = ApiService(authService);
      await api.toggleWishlist(widget.product.id);
    } catch (_) {
      if (mounted) setState(() => _isWishlisted = !_isWishlisted);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final discount =
        ((product.originalPrice - product.sellingPrice) /
                product.originalPrice *
                100)
            .round();
    // Matches the web app (ProductCard.tsx isFrameProduct): contact lens /
    // solution items don't show a frame-width pill or "with Free BLU lenses".
    final categoryText =
        ('${product.categories.join(' ')} ${product.subCategory ?? ''}')
            .toLowerCase();
    final isFrameProduct =
        !categoryText.contains('contact') && !categoryText.contains('lens');

    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area
            Expanded(
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(14),
                      ),
                    ),
                    width: double.infinity,
                    height: double.infinity,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(14),
                      ),
                      child: product.images.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: AppConfig.resolveImageUrl(
                                product.images.first,
                              ),
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: AppColors.gold,
                                    strokeWidth: 2,
                                  ),
                                ),
                              ),
                              errorWidget: (context, url, error) => const Icon(
                                Icons.broken_image_outlined,
                                color: AppColors.muted,
                                size: 40,
                              ),
                            )
                          : const Icon(
                              Icons.visibility_outlined,
                              color: AppColors.muted,
                              size: 60,
                            ),
                    ),
                  ),
                  // Top-left rating badge — matches web's black pill badge
                  // overlaid on the image instead of a separate info row.
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.75),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star, color: AppColors.gold, size: 10),
                              const SizedBox(width: 2),
                              Text(
                                '${product.rating}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (product.isBestseller) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.gold,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'BESTSELLER',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 7,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  // Top-right: wishlist heart (matches web) + a small quick
                  // "Add +" for cart, which the web card doesn't have but is
                  // useful existing mobile functionality worth keeping.
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        GestureDetector(
                          onTap: _toggleWishlist,
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.6),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: Icon(
                              _isWishlisted ? Icons.favorite : Icons.favorite_border,
                              color: _isWishlisted ? Colors.redAccent : Colors.white70,
                              size: 14,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        GestureDetector(
                          onTap: widget.onAddTap,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Add +',
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
                  // Bottom overlay: "View Similar" + color dots — matches web.
                  Positioned(
                    bottom: 8,
                    left: 10,
                    right: 10,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.8),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.grid_view, color: Colors.white60, size: 9),
                              const SizedBox(width: 3),
                              const Text(
                                'View Similar',
                                style: TextStyle(color: Colors.white60, fontSize: 8, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                        if (product.colors.isNotEmpty)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              for (final c in product.colors.take(3))
                                Padding(
                                  padding: const EdgeInsets.only(left: 3),
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: _parseHexColor(c.hex),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                                    ),
                                  ),
                                ),
                              if (product.colors.length > 3)
                                Padding(
                                  padding: const EdgeInsets.only(left: 3),
                                  child: Text(
                                    '+${product.colors.length - 3}',
                                    style: const TextStyle(color: Colors.white60, fontSize: 8, fontWeight: FontWeight.bold),
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
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (isFrameProduct) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'FRAME WIDTH 139 MM (M)',
                        style: TextStyle(
                          color: AppColors.muted,
                          fontSize: 7.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '₹${product.sellingPrice.toInt()}',
                        style: const TextStyle(
                          color: AppColors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
                      if (isFrameProduct) ...[
                        const SizedBox(width: 6),
                        const Flexible(
                          child: Text(
                            'with Free BLU lenses',
                            style: TextStyle(
                              color: Color(0xFF00BBA6),
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (product.originalPrice > product.sellingPrice) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          '₹${product.originalPrice.toInt()}',
                          style: const TextStyle(
                            color: AppColors.muted,
                            decoration: TextDecoration.lineThrough,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '($discount% OFF)',
                          style: const TextStyle(
                            color: Colors.lightBlueAccent,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _parseHexColor(String hex) {
    var value = hex.replaceAll('#', '');
    if (value.length == 6) value = 'FF$value';
    return Color(int.tryParse(value, radix: 16) ?? 0xFF808080);
  }
}

class _FilterSheet extends StatefulWidget {
  final String initialSort;
  final String? initialShape;
  final String? initialMaterial;
  final String? initialSize;
  final String? initialColor;
  final String? initialGender;
  final Function(String, String?, String?, String?, String?, String?) onApply;

  const _FilterSheet({
    required this.initialSort,
    required this.initialShape,
    required this.initialMaterial,
    required this.initialSize,
    required this.initialColor,
    required this.initialGender,
    required this.onApply,
  });

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late String _selectedSort;
  String? _selectedShape;
  String? _selectedMaterial;
  String? _selectedSize;
  String? _selectedColor;
  String? _selectedGender;

  @override
  void initState() {
    super.initState();
    _selectedSort = widget.initialSort;
    _selectedShape = widget.initialShape;
    _selectedMaterial = widget.initialMaterial;
    _selectedSize = widget.initialSize;
    _selectedColor = widget.initialColor;
    _selectedGender = widget.initialGender;
  }

  Widget _buildFilterSection(
    String title,
    List<Map<String, String>> options,
    String? currentValue,
    Function(String?) onSelected,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: AppColors.gold,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final value = opt['value'];
            final label = opt['label'] ?? '';
            final isSelected = currentValue == value;
            return GestureDetector(
              onTap: () {
                if (isSelected) {
                  onSelected(null);
                } else {
                  onSelected(value);
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.gold.withValues(alpha: 0.15)
                      : AppColors.card,
                  border: Border.all(
                    color: isSelected ? AppColors.gold : AppColors.border,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? AppColors.gold : Colors.white70,
                    fontSize: 12,
                    fontWeight: isSelected
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
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
                  'FILTER & SORT',
                  style: TextStyle(
                    color: AppColors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(color: AppColors.border, height: 16),
            ConstrainedBox(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.5,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFilterSection(
                      'Sort By',
                      [
                        {'value': 'newest', 'label': 'Newest'},
                        {'value': 'price_asc', 'label': 'Price: Low to High'},
                        {'value': 'price_desc', 'label': 'Price: High to Low'},
                        {'value': 'rating', 'label': 'Customer Rating'},
                        {'value': 'bestseller', 'label': 'Bestseller'},
                      ],
                      _selectedSort,
                      (val) => setState(() => _selectedSort = val ?? 'newest'),
                    ),
                    _buildFilterSection(
                      'Frame Shape',
                      [
                        {'value': 'Square', 'label': 'Square'},
                        {'value': 'Rectangle', 'label': 'Rectangle'},
                        {'value': 'Aviator', 'label': 'Aviator'},
                        {'value': 'Geometric', 'label': 'Geometric'},
                      ],
                      _selectedShape,
                      (val) => setState(() => _selectedShape = val),
                    ),
                    _buildFilterSection(
                      'Material',
                      [
                        {'value': 'TR90 Premium', 'label': 'TR90 Premium'},
                        {'value': 'Premium Metal', 'label': 'Premium Metal'},
                        {'value': 'Acetate', 'label': 'Acetate'},
                      ],
                      _selectedMaterial,
                      (val) => setState(() => _selectedMaterial = val),
                    ),
                    _buildFilterSection(
                      'Frame Size',
                      [
                        {'value': 'Small', 'label': 'Small'},
                        {'value': 'Medium', 'label': 'Medium'},
                        {'value': 'Large', 'label': 'Large'},
                      ],
                      _selectedSize,
                      (val) => setState(() => _selectedSize = val),
                    ),
                    _buildFilterSection(
                      'Frame Color',
                      [
                        {'value': 'Black', 'label': 'Black'},
                        {'value': 'Matte Black', 'label': 'Matte Black'},
                        {'value': 'Gold', 'label': 'Gold'},
                        {'value': 'Silver', 'label': 'Silver'},
                        {'value': 'Tortoise', 'label': 'Tortoise'},
                        {'value': 'Blue', 'label': 'Blue'},
                      ],
                      _selectedColor,
                      (val) => setState(() => _selectedColor = val),
                    ),
                    _buildFilterSection(
                      'Gender',
                      [
                        {'value': 'Men', 'label': 'Men'},
                        {'value': 'Women', 'label': 'Women'},
                        {'value': 'Kids', 'label': 'Kids'},
                        {'value': 'Unisex', 'label': 'Unisex'},
                      ],
                      _selectedGender,
                      (val) => setState(() => _selectedGender = val),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(color: AppColors.border, height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _selectedSort = 'newest';
                        _selectedShape = null;
                        _selectedMaterial = null;
                        _selectedSize = null;
                        _selectedColor = null;
                        _selectedGender = null;
                      });
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.border),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text(
                      'CLEAR ALL',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onApply(
                        _selectedSort,
                        _selectedShape,
                        _selectedMaterial,
                        _selectedSize,
                        _selectedColor,
                        _selectedGender,
                      );
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text(
                      'APPLY FILTERS',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
