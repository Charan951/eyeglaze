class ProductColor {
  final String name;
  final String hex;
  final String? swatchImage;
  final int stock;
  final List<String> images;

  ProductColor({
    required this.name,
    required this.hex,
    this.swatchImage,
    this.stock = 0,
    this.images = const [],
  });

  factory ProductColor.fromJson(Map<dynamic, dynamic> json) => ProductColor(
        name: json['name']?.toString() ?? '',
        hex: json['hex']?.toString() ?? '#000000',
        swatchImage: json['swatchImage']?.toString(),
        stock: (json['stock'] as num?)?.toInt() ?? 0,
        images: (json['images'] as List<dynamic>?)
                ?.map((img) => img.toString())
                .toList() ??
            [],
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

  factory ProductFrame.fromJson(Map<dynamic, dynamic> json) => ProductFrame(
        type: json['type']?.toString(),
        material: json['material']?.toString(),
        width: (json['width'] as num?)?.toDouble(),
        lensWidth: (json['lensWidth'] as num?)?.toDouble(),
        bridgeWidth: (json['bridgeWidth'] as num?)?.toDouble(),
        templeLength: (json['templeLength'] as num?)?.toDouble(),
        featureTags: (json['featureTags'] as List<dynamic>?)
                ?.map((tag) => tag.toString())
                .toList() ??
            const [],
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

  factory ProductCompatible.fromJson(Map<dynamic, dynamic> json) => ProductCompatible(
        prescription: json['prescription'] == true,
        bluecut: json['bluecut'] == true,
        zeropower: json['zeropower'] == true,
        progressive: json['progressive'] == true,
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
  final List<String> availableSizes;
  final List<SizeMeasurement> sizeMeasurements;

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
    this.availableSizes = const ['Small', 'Medium', 'Large'],
    this.sizeMeasurements = const [],
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final price = json['price'] as Map<dynamic, dynamic>?;
    return Product(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      sku: (json['sku'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      frame: json['frame'] != null ? ProductFrame.fromJson(json['frame'] as Map) : null,
      colors: (json['colors'] as List<dynamic>?)
              ?.map((c) => ProductColor.fromJson(c as Map))
              .toList() ??
          [],
      images: (json['images'] as List<dynamic>?)
              ?.map((img) => img.toString())
              .toList() ??
          [],
      originalPrice: (price?['original'] as num?)?.toDouble() ?? 999,
      sellingPrice: (price?['selling'] as num?)?.toDouble() ?? 1,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      soldCount: (json['soldCount'] as num?)?.toInt() ?? 0,
      categories: (() {
        final list = json['categories'] as List<dynamic>?;
        if (list != null && list.isNotEmpty) {
          return list.map((c) => c.toString()).toList();
        }
        final single = json['category'];
        if (single != null && single.toString().isNotEmpty) {
          return [single.toString()];
        }
        return <String>[];
      })(),
      isBestseller: json['isBestseller'] == true,
      isActive: json['isActive'] != false,
      compatible: json['compatible'] != null
          ? ProductCompatible.fromJson(json['compatible'] as Map)
          : null,
      availableSizes: (json['availableSizes'] as List<dynamic>?)
              ?.map((s) => s.toString())
              .toList() ??
          const ['Small', 'Medium', 'Large'],
      sizeMeasurements: (json['sizeMeasurements'] as List<dynamic>?)
              ?.map((m) => SizeMeasurement.fromJson(m as Map))
              .toList() ??
          const [],
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

class SizeMeasurement {
  final String size;
  final double? lensWidth;
  final double? bridgeWidth;
  final double? templeLength;
  final double? frameWidth;
  final double? frameHeight;

  SizeMeasurement({
    required this.size,
    this.lensWidth,
    this.bridgeWidth,
    this.templeLength,
    this.frameWidth,
    this.frameHeight,
  });

  factory SizeMeasurement.fromJson(Map<dynamic, dynamic> json) => SizeMeasurement(
        size: json['size']?.toString() ?? '',
        lensWidth: (json['lensWidth'] as num?)?.toDouble(),
        bridgeWidth: (json['bridgeWidth'] as num?)?.toDouble(),
        templeLength: (json['templeLength'] as num?)?.toDouble(),
        frameWidth: (json['frameWidth'] as num?)?.toDouble(),
        frameHeight: (json['frameHeight'] as num?)?.toDouble(),
      );
}
