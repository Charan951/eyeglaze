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

    test('isContactLens uses category only, not product name', () {
      final eyeglasses = Product.fromJson({
        '_id': 'eg1',
        'sku': 'EG-AIR',
        'name': 'Lenskart -Air Switch',
        'sellingPrice': 1000,
        'categories': ['Eyeglasses'],
        'categoryId': {'slug': 'eyeglasses', 'name': 'Eyeglasses'},
      });
      expect(eyeglasses.isContactLens, isFalse);
      expect(eyeglasses.isMembershipBogoEligible, isTrue);

      final contacts = Product.fromJson({
        '_id': 'cl1',
        'sku': 'CL-01',
        'name': 'Monthly Disposable',
        'sellingPrice': 499,
        'categoryId': {'slug': 'contact-lenses', 'name': 'Contact Lenses'},
      });
      expect(contacts.isContactLens, isTrue);
      expect(contacts.isMembershipBogoEligible, isFalse);

      final packs = Product.fromJson({
        '_id': 'cl-pack',
        'sku': 'CL-PACK',
        'name': 'Aqualens 24Hrs',
        'sellingPrice': 999,
        'packName': '1 lens/box',
        'categoryId': {'slug': 'contact-lenses', 'name': 'Contact Lenses'},
        'contactPackSiblings': [
          {
            '_id': 'cl-pack',
            'name': 'Aqualens 24Hrs',
            'packName': '1 lens/box',
            'price': 999,
          },
          {
            '_id': 'cl-pack-3',
            'name': 'Aqualens 24Hrs',
            'packName': '3 lens/box',
            'price': 2498,
            'originalPrice': 2997,
          },
        ],
      });
      expect(packs.packName, '1 lens/box');
      expect(packs.contactPackSiblings.length, 2);
      expect(packs.contactPackSiblings[1].packName, '3 lens/box');
      expect(packs.contactPackSiblings[1].price, 2498);

      final solution = Product.fromJson({
        '_id': 'sol1',
        'sku': 'SOL-01',
        'name': 'Lens Solution',
        'sellingPrice': 199,
        'categories': ['Contact Lenses'],
        'subCategory': 'solutions-accessories',
      });
      expect(solution.isMembershipBogoEligible, isFalse);
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
