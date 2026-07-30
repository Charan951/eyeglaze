import 'package:flutter_test/flutter_test.dart';
import 'package:eyeglaze/models/cart_item.dart';

void main() {
  group('CartItem Model Tests', () {
    test('CartItem.fromJson and toJson roundtrip', () {
      final json = {
        '_id': 'item_1',
        'qty': 2,
        'framePrice': 1200,
        'lensPrice': 499,
        'lensType': 'Single Vision',
        'lensQuality': 'Anti-Glare',
      };

      final parsed = CartItem.fromJson(json);
      expect(parsed.id, 'item_1');
      expect(parsed.qty, 2);
      expect(parsed.lensType, 'Single Vision');
    });

    test('totalPrice computes frame and lens total accurately', () {
      final cartItem = CartItem(
        id: 'item_2',
        qty: 3,
        framePrice: 1000,
        lensPrice: 500,
      );

      expect(cartItem.totalPrice, 4500.0); // (1000 + 500) * 3
    });
  });
}
