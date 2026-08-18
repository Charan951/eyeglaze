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

class ContactPackSibling {
  final String id;
  final String name;
  final String sku;
  final String packName;
  final int? lensesPerBox;
  final double price;
  final double? originalPrice;
  final String? thumbnail;

  ContactPackSibling({
    required this.id,
    required this.name,
    this.sku = '',
    required this.packName,
    this.lensesPerBox,
    required this.price,
    this.originalPrice,
    this.thumbnail,
  });

  factory ContactPackSibling.fromJson(Map<dynamic, dynamic> json) => ContactPackSibling(
        id: (json['_id'] ?? json['id'] ?? '').toString(),
        name: json['name']?.toString() ?? '',
        sku: json['sku']?.toString() ?? '',
        packName: json['packName']?.toString() ?? json['name']?.toString() ?? '',
        lensesPerBox: (json['lensesPerBox'] as num?)?.toInt(),
        price: (json['price'] as num?)?.toDouble() ?? 0,
        originalPrice: (json['originalPrice'] as num?)?.toDouble(),
        thumbnail: json['thumbnail']?.toString(),
      );
}

class ContactPackOption {
  final String packName;
  final double price;
  final double? originalPrice;
  final int? lensesPerBox;

  ContactPackOption({
    required this.packName,
    required this.price,
    this.originalPrice,
    this.lensesPerBox,
  });

  factory ContactPackOption.fromJson(Map<dynamic, dynamic> json) => ContactPackOption(
        packName: json['packName']?.toString() ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        originalPrice: (json['originalPrice'] as num?)?.toDouble(),
        lensesPerBox: (json['lensesPerBox'] as num?)?.toInt(),
      );
}

class ContactPower {
  final String power;
  final double price;

  ContactPower({required this.power, required this.price});

  factory ContactPower.fromJson(Map<dynamic, dynamic> json) => ContactPower(
        power: json['power']?.toString() ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0.0,
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
  final String? subCategory;
  final List<String> readingPowers;
  final List<ContactPower> contactPowers;
  final List<ContactPackSibling> contactPackSiblings;
  final List<ContactPackOption> contactPackOptions;
  final String? packName;
  final String? contactPackGroupId;
  final String? contactDisposableType;
  final bool sellAsFrame;
  final bool sellWithLens;

  // New Dynamic & Premium Specification Fields
  final List<String> offerBadges;
  final bool isPremium;
  final bool buy1Get1;
  final bool oneRupeeFrameOffer;
  final String? shortDescription;
  final String? longDescription;
  final String? warranty;
  final double? memberPrice;
  final double? nonMemberPrice;
  final String? frameType;
  final String? frameShape;
  final String? material;
  final String? frameWeight;
  final String? countryOfOrigin;
  final String? manufacturer;
  final List<String> gender;
  final String? thumbnail;
  final String? brand;

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
    this.subCategory,
    this.readingPowers = const [],
    this.contactPowers = const [],
    this.contactPackSiblings = const [],
    this.contactPackOptions = const [],
    this.packName,
    this.contactPackGroupId,
    this.contactDisposableType,
    this.sellAsFrame = true,
    this.sellWithLens = true,
    this.offerBadges = const [],
    this.isPremium = false,
    this.buy1Get1 = false,
    this.oneRupeeFrameOffer = false,
    this.shortDescription,
    this.longDescription,
    this.warranty,
    this.memberPrice,
    this.nonMemberPrice,
    this.frameType,
    this.frameShape,
    this.material,
    this.frameWeight,
    this.countryOfOrigin,
    this.manufacturer,
    this.gender = const [],
    this.thumbnail,
    this.brand,
  });

  /// Category-only, matching web `isContactLensProduct`. Product names like
  /// "Lenskart" must not be treated as contact lenses.
  bool get isContactLens =>
      categories.any((c) => c.toLowerCase().contains('contact'));

  bool get isSolutionOrAccessory {
    final blob = [...categories, subCategory ?? ''].join(' ').toLowerCase();
    return blob.contains('solution') || blob.contains('accessor');
  }

  bool get isMembershipBogoEligible =>
      !isContactLens && !isSolutionOrAccessory;

  factory Product.fromJson(Map<String, dynamic> json) {
    final priceObj = json['price'];
    final Map<dynamic, dynamic>? priceMap = priceObj is Map ? priceObj : null;
    final double? directNum = priceObj is num ? priceObj.toDouble() : null;

    final double origPrice = (priceMap?['original'] as num?)?.toDouble() ??
        (json['originalPrice'] as num?)?.toDouble() ??
        directNum ??
        999.0;
    final double sellPrice = (priceMap?['selling'] as num?)?.toDouble() ??
        (json['sellingPrice'] as num?)?.toDouble() ??
        directNum ??
        1.0;

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
      originalPrice: origPrice,
      sellingPrice: sellPrice,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      soldCount: (json['soldCount'] as num?)?.toInt() ?? 0,
      categories: (() {
        final values = <String>[];
        void add(dynamic v) {
          if (v == null) return;
          if (v is Map) {
            add(v['slug']);
            add(v['name']);
            return;
          }
          final s = v.toString();
          if (s.isNotEmpty && s != 'null') values.add(s);
        }
        final list = json['categories'] as List<dynamic>?;
        if (list != null) {
          for (final c in list) {
            add(c);
          }
        }
        add(json['category']);
        add(json['categoryId']);
        return values;
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
      subCategory: json['subCategory']?.toString(),
      readingPowers: (json['readingPowers'] as List<dynamic>?)
              ?.map((s) => s.toString())
              .toList() ??
          const [],
      contactPowers: (json['contactPowers'] as List<dynamic>?)
              ?.map((c) => ContactPower.fromJson(c as Map))
              .toList() ??
          const [],
      contactPackSiblings: (json['contactPackSiblings'] as List<dynamic>?)
              ?.map((c) => ContactPackSibling.fromJson(c as Map))
              .toList() ??
          const [],
      contactPackOptions: (json['contactPackOptions'] as List<dynamic>?)
              ?.map((c) => ContactPackOption.fromJson(c as Map))
              .toList() ??
          const [],
      packName: json['packName']?.toString(),
      contactPackGroupId: json['contactPackGroupId']?.toString(),
      contactDisposableType: json['contactDisposableType']?.toString(),
      sellAsFrame: json['sellAsFrame'] != false,
      sellWithLens: json['sellWithLens'] != false,
      
      // New fields parsing
      offerBadges: (json['offerBadges'] as List<dynamic>?)
              ?.map((b) => b.toString())
              .toList() ??
          const [],
      isPremium: json['isPremium'] == true,
      buy1Get1: json['buy1Get1'] == true,
      oneRupeeFrameOffer: json['oneRupeeFrameOffer'] == true,
      shortDescription: json['shortDescription']?.toString(),
      longDescription: json['longDescription']?.toString() ?? json['description']?.toString(),
      warranty: json['warranty']?.toString(),
      memberPrice: (json['memberPrice'] as num?)?.toDouble() ??
          (json['memberPrices'] is Map
              ? (json['memberPrices']['goldMemberPrice'] as num?)?.toDouble()
              : null),
      nonMemberPrice: (json['nonMemberPrice'] as num?)?.toDouble(),
      frameType: json['frameType']?.toString() ?? json['frame']?['type']?.toString(),
      frameShape: json['frameShape']?.toString() ?? json['shape']?.toString(),
      material: json['material']?.toString() ?? json['frame']?['material']?.toString(),
      frameWeight: json['frameWeight']?.toString(),
      countryOfOrigin: json['countryOfOrigin']?.toString(),
      manufacturer: json['manufacturer']?.toString(),
      gender: (() {
        final val = json['gender'];
        if (val is List) {
          return val.map((g) => g.toString()).toList();
        } else if (val is String) {
          return [val];
        }
        return const <String>[];
      })(),
      thumbnail: json['thumbnail']?.toString(),
      brand: json['brand']?.toString(),
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
        'buy1Get1': buy1Get1,
        'oneRupeeFrameOffer': oneRupeeFrameOffer,
        'images': images,
        'thumbnail': thumbnail,
        'memberPrice': memberPrice,
        'nonMemberPrice': nonMemberPrice,
        'brand': brand,
        'categories': categories,
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
