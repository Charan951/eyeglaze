import 'product.dart';

class PowerData {
  final double? sph;
  final double? cyl;
  final int? axis;

  PowerData({this.sph, this.cyl, this.axis});

  factory PowerData.fromJson(Map<String, dynamic> json) => PowerData(
        sph: (json['sph'] as num?)?.toDouble(),
        cyl: (json['cyl'] as num?)?.toDouble(),
        axis: json['axis'],
      );

  Map<String, dynamic> toJson() => {'sph': sph, 'cyl': cyl, 'axis': axis};
}

class PrescriptionData {
  final PowerData? re;
  final PowerData? le;
  final double? pd;

  PrescriptionData({this.re, this.le, this.pd});

  factory PrescriptionData.fromJson(Map<String, dynamic> json) => PrescriptionData(
        re: json['RE'] != null ? PowerData.fromJson(json['RE']) : null,
        le: json['LE'] != null ? PowerData.fromJson(json['LE']) : null,
        pd: (json['pd'] as num?)?.toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'RE': re?.toJson(),
        'LE': le?.toJson(),
        'pd': pd,
      };
}

class CartItem {
  final String id;
  final Product? product;
  final int qty;
  final String? selectedColor;
  final String? lensType;
  final String? lensSubType;
  final String? lensQuality;
  final PrescriptionData? lensConfig;
  final double framePrice;
  final double? lensPrice;
  final double? fittingCharge;

  CartItem({
    required this.id,
    this.product,
    this.qty = 1,
    this.selectedColor,
    this.lensType,
    this.lensSubType,
    this.lensQuality,
    this.lensConfig,
    this.framePrice = 1,
    this.lensPrice,
    this.fittingCharge,
  });

  double get totalPrice {
    double total = framePrice;
    if (lensPrice != null) total += lensPrice!;
    return total * qty;
  }

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: json['_id'] ?? json['id'] ?? '',
        product: json['product'] is Map ? Product.fromJson(json['product']) : null,
        qty: json['qty'] ?? 1,
        selectedColor: json['color'],
        lensType: json['lensType'],
        lensSubType: json['lensSubType'],
        lensQuality: json['lensQuality'],
        lensConfig: json['power'] != null ? PrescriptionData.fromJson(json['power']) : null,
        framePrice: (json['framePrice'] as num?)?.toDouble() ?? 1,
        lensPrice: (json['lensPrice'] as num?)?.toDouble(),
        fittingCharge: (json['fittingCharge'] as num?)?.toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'product': product?.id,
        'qty': qty,
        'color': selectedColor,
        'lensType': lensType,
        'lensSubType': lensSubType,
        'lensQuality': lensQuality,
        'power': lensConfig?.toJson(),
        'framePrice': framePrice,
        'lensPrice': lensPrice,
        'fittingCharge': fittingCharge,
      };
}
