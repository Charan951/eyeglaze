import 'package:flutter/foundation.dart';
import 'api_service.dart';

class MembershipPriceProvider extends ChangeNotifier {
  static const defaultPrice = 129.0;

  double _price = defaultPrice;
  double get price => _price;
  int get priceInt => _price.round();

  Future<void> load(ApiService api) async {
    try {
      final data = await api.getSettings();
      final raw = data['settings'] is Map ? data['settings']['membershipPrice'] : null;
      final parsed = raw is num ? raw.toDouble() : double.tryParse('$raw');
      if (parsed != null && parsed > 0 && parsed != _price) {
        _price = parsed;
        notifyListeners();
      }
    } catch (_) {}
  }
}
