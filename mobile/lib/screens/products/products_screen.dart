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
import '../../widgets/eyeglaze_logo.dart';
import 'product_detail_screen.dart';
import '../home/home_screen.dart';
import '../../widgets/responsive_container.dart';

class ProductsScreen extends StatefulWidget {
  final String? category;
  final String? shape;
  final String? gender;
  const ProductsScreen({super.key, this.category, this.shape, this.gender});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<Product> _products = [];
  bool _loading = true;
  String? _selectedCategory;
  String? _selectedShape;
  String _selectedSort = 'newest';
  String? _selectedMaterial;
  String? _selectedSize;
  String? _selectedColor;
  String? _selectedGender;
  final _searchCtrl = TextEditingController();

  final _categories = ['All', 'Prescription', 'Sunglasses', 'Blue Cut', 'Contact Lenses', 'Kids'];

  @override
  void initState() {
    super.initState();
    _selectedShape = widget.shape;
    _selectedGender = widget.gender;
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
    _searchCtrl.dispose();
    try {
      final socketService = context.read<SocketService>();
      socketService.socket?.off('product_changed', _onProductChanged);
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

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      final authService = context.read<AuthService>();
      final api = ApiService(authService);
      final data = await api.getProducts(
        category: _normalizeCategory(_selectedCategory),
        search: _searchCtrl.text.isEmpty ? null : _searchCtrl.text,
        sort: _selectedSort,
        shape: _selectedShape,
        material: _selectedMaterial,
        size: _selectedSize,
        color: _selectedColor,
        gender: _selectedGender,
      );
      final list = (data['products'] ?? data['data'] ?? []) as List;
      setState(() => _products = list.map((p) => Product.fromJson(p)).toList());
    } catch (e) {
      // show demo products
      setState(() => _products = _demoProducts());
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
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Please login to add items to cart'),
          backgroundColor: AppColors.error,
        ));
        Navigator.pushNamed(context, '/login');
        return;
      }
      final api = ApiService(authService);
      final defaultColor = product.colors.isNotEmpty ? product.colors.first.name : 'Matte Black';
      await api.addToCart({
        'productId': product.id,
        'qty': 1,
        'color': defaultColor,
        'framePrice': product.sellingPrice,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('${product.name} added to cart!'),
          backgroundColor: AppColors.gold,
        ));
        // Refresh cart badge count instantly
        HomeScreen.state?.loadCartCount();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed to add to cart: $e'),
          backgroundColor: AppColors.error,
        ));
      }
    }
  }

  List<Product> _demoProducts() => [
        Product(
          id: '1', sku: 'EG-2041', name: 'Matte Square Frame',
          originalPrice: 999, sellingPrice: 1,
          rating: 4.7, reviewCount: 198, soldCount: 400,
          isBestseller: true,
          colors: [ProductColor(name: 'Matte Black', hex: '#1A1A1A')],
          frame: ProductFrame(type: 'Square', material: 'TR90 Premium', width: 140, lensWidth: 54, bridgeWidth: 18, templeLength: 145),
        ),
        Product(
          id: '2', sku: 'EG-1067', name: 'Premium Clubmaster Frame',
          originalPrice: 999, sellingPrice: 1,
          rating: 4.5, reviewCount: 124, soldCount: 250,
          isBestseller: false,
          colors: [ProductColor(name: 'Black Gold', hex: '#C9A84C')],
          frame: ProductFrame(type: 'Clubmaster', material: 'Premium Metal', width: 138, lensWidth: 52, bridgeWidth: 18, templeLength: 145),
        ),
      ];

  Widget _buildActiveFiltersList() {
    final List<Widget> chips = [];
    
    if (_selectedShape != null) {
      chips.add(_buildFilterChip('Shape: $_selectedShape', () {
        setState(() => _selectedShape = null);
        _loadProducts();
      }));
    }
    if (_selectedSort != 'newest') {
      String sortName = _selectedSort;
      if (_selectedSort == 'price_asc') sortName = 'Price: Low to High';
      if (_selectedSort == 'price_desc') sortName = 'Price: High to Low';
      if (_selectedSort == 'rating') sortName = 'Rating';
      if (_selectedSort == 'bestseller') sortName = 'Bestseller';
      chips.add(_buildFilterChip('Sort: $sortName', () {
        setState(() => _selectedSort = 'newest');
        _loadProducts();
      }));
    }
    if (_selectedMaterial != null) {
      chips.add(_buildFilterChip('Material: $_selectedMaterial', () {
        setState(() => _selectedMaterial = null);
        _loadProducts();
      }));
    }
    if (_selectedSize != null) {
      chips.add(_buildFilterChip('Size: $_selectedSize', () {
        setState(() => _selectedSize = null);
        _loadProducts();
      }));
    }
    if (_selectedColor != null) {
      chips.add(_buildFilterChip('Color: $_selectedColor', () {
        setState(() => _selectedColor = null);
        _loadProducts();
      }));
    }
    if (_selectedGender != null) {
      chips.add(_buildFilterChip('Gender: $_selectedGender', () {
        setState(() => _selectedGender = null);
        _loadProducts();
      }));
    }

    if (chips.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 38,
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: chips,
      ),
    );
  }

  Widget _buildFilterChip(String label, VoidCallback onClear) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Chip(
        label: Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.gold.withValues(alpha: 0.8),
        deleteIcon: const Icon(Icons.close, size: 14, color: Colors.white),
        onDeleted: onClear,
        padding: EdgeInsets.zero,
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.white), onPressed: () => Navigator.pop(context)),
        title: const EyeGlazeLogo(),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.search, color: AppColors.white), onPressed: () {}),
        ],
      ),
      body: ResponsiveContainer(
        maxWidth: 900,
        child: Column(
          children: [
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
            // Category chips
            SizedBox(
              height: 44,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _categories.length,
                itemBuilder: (_, i) {
                  final cat = _categories[i];
                  final isSelected = cat == _selectedCategory;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedCategory = cat;
                          _selectedShape = null; // Clear shape filter on category change
                        });
                        _loadProducts();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.gold : AppColors.card,
                          border: Border.all(color: isSelected ? AppColors.gold : AppColors.border),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(cat, style: TextStyle(color: isSelected ? Colors.white : AppColors.muted, fontSize: 13, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                      ),
                    ),
                  );
                },
              ),
            ),
            _buildActiveFiltersList(),
            const SizedBox(height: 8),
            // Product grid
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.gold))
                  : _products.isEmpty
                      ? const Center(child: Text('No products found', style: AppTextStyles.muted))
                      : LayoutBuilder(
                          builder: (context, constraints) {
                            final width = constraints.maxWidth;
                            final crossAxisCount = width > 750 ? 4 : (width > 500 ? 3 : 2);
                            return GridView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: crossAxisCount,
                                childAspectRatio: 0.62,
                                crossAxisSpacing: 10,
                                mainAxisSpacing: 10,
                              ),
                              itemCount: _products.length,
                              itemBuilder: (_, i) => _ProductCard(
                                product: _products[i],
                                onTap: () async {
                                  await Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => ProductDetailScreen(product: _products[i]),
                                  ));
                                  if (mounted) {
                                    _loadProducts();
                                    HomeScreen.state?.loadCartCount();
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

class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  final VoidCallback onAddTap;

  const _ProductCard({
    required this.product,
    required this.onTap,
    required this.onAddTap,
  });

  @override
  Widget build(BuildContext context) {
    final discount = ((product.originalPrice - product.sellingPrice) / product.originalPrice * 100).round();
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
            // Image area
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
                  if (product.isBestseller)
                    Positioned(
                      top: 8, left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)),
                        child: const Text('BESTSELLER', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  Positioned(
                    top: 8, right: 8,
                    child: GestureDetector(
                      onTap: onAddTap,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(6)),
                        child: const Text('Add +', style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
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
                  Text(product.sku, style: const TextStyle(color: AppColors.muted, fontSize: 10)),
                  Text(product.name, style: const TextStyle(color: AppColors.white, fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, color: AppColors.gold, size: 12),
                      Text(' ${product.rating}', style: const TextStyle(color: AppColors.gold, fontSize: 11)),
                      Text('  (${product.reviewCount})', style: const TextStyle(color: AppColors.muted, fontSize: 10)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text('₹${product.sellingPrice.toInt()}', style: const TextStyle(color: AppColors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                      const SizedBox(width: 6),
                      Text('₹${product.originalPrice.toInt()}', style: const TextStyle(color: AppColors.muted, decoration: TextDecoration.lineThrough, fontSize: 11)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4)),
                        child: Text('$discount%', style: const TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold)),
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

  Widget _buildFilterSection(String title, List<Map<String, String>> options, String? currentValue, Function(String?) onSelected) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
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
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.gold.withValues(alpha: 0.15) : AppColors.card,
                  border: Border.all(color: isSelected ? AppColors.gold : AppColors.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? AppColors.gold : Colors.white70,
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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
                  style: TextStyle(color: AppColors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.5),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('CLEAR ALL', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('APPLY FILTERS', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
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
