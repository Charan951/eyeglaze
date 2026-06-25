import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../models/cart_item.dart';

class LensWizardState extends ChangeNotifier {
  Product? product;
  String? selectedColor;

  // Step 1: Lens Type
  String? lensType;
  String? lensSubType;
  String? selectedTypeId; // The DB ObjectId of the selected LensType
  String? selectedTypeDisplayName;

  // Step 2: Quality
  String? selectedQualityId; // The ID of the selected Lens or Quality Option
  String? lensQuality;
  double? lensPrice;

  // Step 3: Power / Prescription Details
  PowerData? rightEye;
  PowerData? leftEye;
  double? pd = 62.0;
  double addPower = 1.00;

  // Prescription Upload & UI States
  String prescriptionMode = 'enter'; // 'enter' or 'upload'
  String? uploadedFileUrl;
  String? uploadedFileName;
  String? prescriptionName;
  String? selectedPrescriptionId;
  List<dynamic> savedPrescriptions = [];

  // Dynamic lens configurations from the product detail endpoint
  List<dynamic> customLenses = [];
  List<dynamic> rawLensTypes = [];
  List<Map<String, dynamic>> mappedLensTypes = [];

  void setProduct(Product p, String color) {
    product = p;
    selectedColor = color;
    notifyListeners();
  }

  void setProductAndLenses({
    required Product p,
    required String color,
    required List<dynamic> lensesList,
    required List<dynamic> lensTypesFromApi,
  }) {
    product = p;
    selectedColor = color;
    customLenses = lensesList;
    rawLensTypes = lensTypesFromApi;

    // Group custom lenses by their type ID or name to find the minimum/starting price
    final minPrices = <String, double>{};
    for (final lens in lensesList) {
      final lensTypeObj = lens['lensType'];
      String? typeId;
      if (lensTypeObj is Map) {
        typeId = lensTypeObj['_id']?.toString();
      } else if (lensTypeObj != null) {
        typeId = lensTypeObj.toString();
      }
      if (typeId != null && typeId.isNotEmpty) {
        final basePrice = (lens['basePrice'] as num?)?.toDouble() ?? 999.0;
        if (minPrices[typeId] == null || basePrice < minPrices[typeId]!) {
          minPrices[typeId] = basePrice;
        }
      }
    }

    mappedLensTypes = [];
    for (final t in lensTypesFromApi) {
      if (t is! Map) continue;
      final id = t['_id']?.toString() ?? '';
      final name = t['name']?.toString() ?? '';
      if (name.isEmpty) continue;

      final lowercaseName = name.toLowerCase();
      String type = 'zero_power';
      String description = 'Clear lenses for everyday wear with no prescription.';
      String displayName = name;

      if (lowercaseName.contains('single vision')) {
        type = 'single_vision';
        description = 'Single vision lenses corrected for distance or reading.';
      } else if (lowercaseName.contains('progressive')) {
        type = 'progressive';
        description = 'Multifocal lenses for clear vision at all distances.';
      } else if (lowercaseName.contains('blue cut') || lowercaseName.contains('bluecut')) {
        type = 'bluecut';
        description = 'Protects eyes from harmful blue light emitted by digital screens.';
      } else if (lowercaseName.contains('photochromic')) {
        type = 'photochromic';
        description = 'Lenses that darken automatically in sunlight and stay clear indoors.';
      } else if (lowercaseName.contains('with power')) {
        type = 'single_vision';
        description = 'Prescription lenses tailored to your power requirements.';
      }

      final double price = minPrices[id] ?? (t['price'] as num?)?.toDouble() ?? 999.0;

      mappedLensTypes.add({
        '_id': id,
        'kind': 'type',
        'type': type,
        'displayName': displayName,
        'name': name,
        'description': description,
        'price': price,
        'startingPrice': price,
        'isBestseller': lowercaseName.contains('with power') || lowercaseName.contains('zero power'),
      });
    }

    notifyListeners();
  }

  void setLensType(String type, {String? subType, String? typeId, String? displayName}) {
    lensType = type;
    lensSubType = subType;
    selectedTypeId = typeId;
    selectedTypeDisplayName = displayName;
    notifyListeners();
  }

  void setLensQuality(String quality, double price, {String? qualityId}) {
    lensQuality = quality;
    lensPrice = price;
    selectedQualityId = qualityId;
    notifyListeners();
  }

  void setPower({PowerData? re, PowerData? le, double? pupillaryDistance}) {
    rightEye = re;
    leftEye = le;
    if (pupillaryDistance != null) pd = pupillaryDistance;
    notifyListeners();
  }

  void setPrescriptionMode(String mode) {
    prescriptionMode = mode;
    notifyListeners();
  }

  void setUploadedFile(String? url, String? filename) {
    uploadedFileUrl = url;
    uploadedFileName = filename;
    notifyListeners();
  }

  void setPrescriptionName(String? name) {
    prescriptionName = name;
    notifyListeners();
  }

  void setSelectedPrescriptionId(String? id) {
    selectedPrescriptionId = id;
    notifyListeners();
  }

  void setSavedPrescriptions(List<dynamic> list) {
    savedPrescriptions = list;
    notifyListeners();
  }

  double get totalPrice {
    double total = product?.sellingPrice ?? 0.0;
    if (lensPrice != null) total += lensPrice!;
    total += 199.0; // fitting charge
    return total;
  }

  String get sizeString {
    final f = product?.frame;
    if (f == null) return '';
    return '${f.lensWidth?.toInt() ?? 0}-${f.bridgeWidth?.toInt() ?? 0}-${f.templeLength?.toInt() ?? 0}';
  }

  bool get powerRequired {
    return lensType == 'single_vision' ||
        lensType == 'progressive' ||
        lensType == 'photochromic';
  }

  void reset() {
    product = null;
    selectedColor = null;
    lensType = null;
    lensSubType = null;
    selectedTypeId = null;
    selectedTypeDisplayName = null;
    selectedQualityId = null;
    lensQuality = null;
    lensPrice = null;
    rightEye = null;
    leftEye = null;
    pd = 62.0;
    addPower = 1.00;
    prescriptionMode = 'enter';
    uploadedFileUrl = null;
    uploadedFileName = null;
    prescriptionName = null;
    selectedPrescriptionId = null;
    savedPrescriptions = [];
    customLenses = [];
    rawLensTypes = [];
    mappedLensTypes = [];
    notifyListeners();
  }
}
