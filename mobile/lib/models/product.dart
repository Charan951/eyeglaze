class ProductColor {
  final String name;
  final String hex;
  final String? swatchImage;
  final int stock;

  ProductColor({
    required this.name,
    required this.hex,
    this.swatchImage,
    this.stock = 0,
  });

  factory ProductColor.fromJson(Map<String, dynamic> json) => ProductColor(
        name: json['name'] ?? '',
        hex: json['hex'] ?? '#000000',
        swatchImage: json['swatchImage'],
        stock: json['stock'] ?? 0,
      );
}

class ProductFrame {
  final String? type;
  final String? material;
  final double? width;
  final double? lensWidth;
  final double? bridgeWidth;
  final double? templeLength;
  final List<String> featureTags;

  ProductFrame({
    this.type,
    this.material,
    this.width,
    this.lensWidth,
    this.bridgeWidth,
    this.templeLength,
    this.featureTags = const [],
  });

  factory ProductFrame.fromJson(Map<String, dynamic> json) => ProductFrame(
        type: json['type'],
        material: json['material'],
        width: (json['width'] as num?)?.toDouble(),
        lensWidth: (json['lensWidth'] as num?)?.toDouble(),
        bridgeWidth: (json['bridgeWidth'] as num?)?.toDouble(),
        templeLength: (json['templeLength'] as num?)?.toDouble(),
        featureTags: List<String>.from(json['featureTags'] ?? []),
      );
}

class ProductCompatible {
  final bool prescription;
  final bool bluecut;
  final bool zeropower;
  final bool progressive;

  ProductCompatible({
    this.prescription = false,
    this.bluecut = false,
    this.zeropower = false,
    this.progressive = false,
  });

  factory ProductCompatible.fromJson(Map<String, dynamic> json) => ProductCompatible(
        prescription: json['prescription'] ?? false,
        bluecut: json['bluecut'] ?? false,
        zeropower: json['zeropower'] ?? false,
        progressive: json['progressive'] ?? false,
      );
}

class Product {
  final String id;
  final String sku;
  final String name;
  final ProductFrame? frame;
  final List<ProductColor> colors;
  final List<String> images;
  final double originalPrice;
  final double sellingPrice;
  final double rating;
  final int reviewCount;
  final int soldCount;
  final List<String> categories;
  final bool isBestseller;
  final bool isActive;
  final ProductCompatible? compatible;

  Product({
    required this.id,
    required this.sku,
    required this.name,
    this.frame,
    this.colors = const [],
    this.images = const [],
    this.originalPrice = 999,
    this.sellingPrice = 1,
    this.rating = 0,
    this.reviewCount = 0,
    this.soldCount = 0,
    this.categories = const [],
    this.isBestseller = false,
    this.isActive = true,
    this.compatible,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final price = json['price'] as Map<String, dynamic>?;
    return Product(
      id: json['_id'] ?? json['id'] ?? '',
      sku: json['sku'] ?? '',
      name: json['name'] ?? '',
      frame: json['frame'] != null ? ProductFrame.fromJson(json['frame']) : null,
      colors: (json['colors'] as List<dynamic>?)
              ?.map((c) => ProductColor.fromJson(c))
              .toList() ??
          [],
      images: List<String>.from(json['images'] ?? []).isNotEmpty
          ? List<String>.from(json['images'] ?? [])
          : (json['thumbnail'] != null
              ? [json['thumbnail'] as String]
              : (json['frontView'] != null ? [json['frontView'] as String] : [])),
      originalPrice: (price?['original'] as num?)?.toDouble() ?? 999,
      sellingPrice: (price?['selling'] as num?)?.toDouble() ?? 1,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: json['reviewCount'] ?? 0,
      soldCount: json['soldCount'] ?? 0,
      categories: List<String>.from(json['categories'] ?? []),
      isBestseller: json['isBestseller'] ?? false,
      isActive: json['isActive'] ?? true,
      compatible: json['compatible'] != null
          ? ProductCompatible.fromJson(json['compatible'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'sku': sku,
        'name': name,
        'price': {'original': originalPrice, 'selling': sellingPrice},
        'rating': rating,
        'reviewCount': reviewCount,
        'isBestseller': isBestseller,
      };
}
