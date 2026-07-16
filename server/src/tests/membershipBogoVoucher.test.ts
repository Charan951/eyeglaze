import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import assert from 'assert';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { generateMemberCoupons } from '../controllers/coupons.controller';
import { CouponEngine } from '../services/couponEngine';

async function runBogoVoucherTests() {
  console.log('🚀 Initializing Test Database for Membership BOGO Voucher...');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to Test Database.');

  try {
    // 1. Create a user
    const user = await User.create({
      name: 'BOGO Test User',
      email: 'bogotest@eyeglaze.com',
      role: 'customer',
      membershipActive: false,
      isVerified: true,
    });

    console.log('🧪 Testing Coupon Generation...');
    // 2. Generate member coupons
    const coupons = await generateMemberCoupons(user._id);

    // Verify 50% discount coupon
    assert.strictEqual(coupons.percentCoupon.discountType, 'percent');
    assert.strictEqual(coupons.percentCoupon.discountValue, 50);
    assert.strictEqual(coupons.percentCoupon.userSpecific.toString(), user._id.toString());
    console.log('   👉 PASS: 50% member coupon generated successfully.');

    // Verify 30-day BOGO voucher
    assert.strictEqual(coupons.bogoCoupon.discountType, 'bogo');
    assert.strictEqual(coupons.bogoCoupon.couponType, 'BOGO');
    assert.strictEqual(coupons.bogoCoupon.userSpecific.toString(), user._id.toString());
    
    // Check 30 days validity
    const expectedExpiry = new Date();
    expectedExpiry.setDate(expectedExpiry.getDate() + 30);
    const diffTime = Math.abs(coupons.bogoCoupon.validTo.getTime() - expectedExpiry.getTime());
    assert.ok(diffTime < 5000, `BOGO expiry date should be 30 days from now (diff: ${diffTime}ms)`);
    console.log('   👉 PASS: BOGO voucher generated with 30 days validity.');

    // 3. Test CouponEngine validation for the generated BOGO voucher
    console.log('🧪 Testing CouponEngine validation of BOGO voucher...');
    
    // Create cart items where cheapest is free
    const cartItems = [
      { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 2000, category: 'Eyeglasses', brand: 'Vince Chase', buy1Get1: true },
      { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1500, category: 'Eyeglasses', brand: 'Vince Chase', buy1Get1: true },
    ];

    const validationResult = await CouponEngine.validate(coupons.bogoCoupon.code, user._id.toString(), {
      cartTotal: 3500,
      items: cartItems,
    });

    assert.strictEqual(validationResult.valid, true);
    assert.strictEqual(validationResult.discountAmount, 1500); // cheapest item (1500) should be free
    console.log('   👉 PASS: CouponEngine correctly validated BOGO voucher and computed discount.');

    console.log('🎉 ALL MEMBERSHIP BOGO VOUCHER TESTS PASSED!');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('🧹 Cleanup complete.');
  }
}

runBogoVoucherTests();
