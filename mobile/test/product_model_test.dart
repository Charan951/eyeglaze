import 'package:flutter_test/flutter_test.dart';
import 'package:eyeglaze/models/product.dart';

void main() {
  group('Product Model Tests', () {
    test('Product.fromJson parses full valid json correctly', () {
      final json = {
        '_id': 'prod123',
        'sku': 'EG-123',
        'name': 'Classic Aviator Glass',
        'title': 'Classic Aviator',
        'price': 1999.0,
        'sellingPrice': 1499.0,
        'memberPrice': 999.0,
        'nonMemberPrice': 1499.0,
        'images': ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        'categories': ['Eyeglasses'],
        'frameShape': 'Aviator',
        'gender': ['Unisex'],
        'material': 'Titanium',
        'inStock': true,
        'buy1Get1': true,
        'oneRupeeFrameOffer': true,
      };

      final product = Product.fromJson(json);

      expect(product.id, 'prod123');
      expect(product.sku, 'EG-123');
      expect(product.name, 'Classic Aviator Glass');
      expect(product.sellingPrice, 1499.0);
      expect(product.memberPrice, 999.0);
      expect(product.nonMemberPrice, 1499.0);
      expect(product.images.length, 2);
      expect(product.categories, contains('Eyeglasses'));
      expect(product.frameShape, 'Aviator');
      expect(product.buy1Get1, isTrue);
      expect(product.oneRupeeFrameOffer, isTrue);
    });

    test('Product constructor initializes defaults', () {
      final product = Product(
        id: 'p2',
        sku: 'SKU-002',
        name: 'Simple Frame',
        sellingPrice: 500,
        images: [],
      );

      expect(product.id, 'p2');
      expect(product.sku, 'SKU-002');
      expect(product.name, 'Simple Frame');
      expect(product.images, isEmpty);
    });
  });
}
