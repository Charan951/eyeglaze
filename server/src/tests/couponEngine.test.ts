import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import assert from 'assert';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { CouponUsage } from '../models/CouponUsage';
import { CouponEngine } from '../services/couponEngine';

async function runTests() {
  console.log('🚀 Initializing In-Memory Test Database...');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to Test Database.');

  try {
    // ----------------------------------------------------
    // Seed Test Data
    // ----------------------------------------------------
    console.log('🌱 Seeding Test Coupons and Users...');
    
    const flatCoupon = await Coupon.create({
      code: 'FLAT500',
      name: 'Flat 500 Off',
      description: 'Get Flat 500 discount on your order',
      discountType: 'flat',
      couponType: 'Standard',
      discountValue: 500,
      minOrderValue: 1000,
      isActive: true,
    });

    const percentCoupon = await Coupon.create({
      code: 'PERCENT20',
      name: '20% Off capped at 300',
      description: 'Get 20% off up to 300',
      discountType: 'percent',
      couponType: 'Standard',
      discountValue: 20,
      maxDiscount: 300,
      minOrderValue: 500,
      isActive: true,
    });

    const bogoCoupon = await Coupon.create({
      code: 'BUY1GET1',
      name: 'BOGO',
      description: 'Cheapest frame free',
      discountType: 'bogo',
      couponType: 'BOGO',
      discountValue: 1,
      isActive: true,
    });

    const membershipCoupon = await Coupon.create({
      code: 'GOLDVIP',
      name: 'Gold members only',
      description: 'VIP discount',
      discountType: 'percent',
      couponType: 'Membership',
      discountValue: 10,
      membershipRequired: true,
      isActive: true,
    });

    const restrictedCoupon = await Coupon.create({
      code: 'NOCATEGORY',
      name: 'No Sunglasses',
      description: 'Valid only on categories other than Sunglasses',
      discountType: 'percent',
      couponType: 'Standard',
      discountValue: 15,
      excludedCategories: ['Sunglasses'],
      isActive: true,
    });

    const vipUser = await User.create({
      name: 'Vip Customer',
      email: 'vip@eyeglaze.com',
      role: 'customer',
      membershipActive: true,
      isVerified: true,
    });

    const normalUser = await User.create({
      name: 'Regular Customer',
      email: 'normal@eyeglaze.com',
      role: 'customer',
      membershipActive: false,
      isVerified: true,
    });

    // ----------------------------------------------------
    // Test Case 1: Flat discount validation & calculation
    // ----------------------------------------------------
    console.log('🧪 Running Test Case 1: Flat Coupon (FLAT500)');
    const res1 = await CouponEngine.validate('FLAT500', normalUser._id.toString(), {
      cartTotal: 1200,
      items: [
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1200, category: 'Frames', brand: 'Glaze' }
      ]
    });
    
    assert.strictEqual(res1.valid, true, 'FLAT500 should be valid for cart total 1200');
    assert.strictEqual(res1.discountAmount, 500, 'FLAT500 should deduct exactly 500');
    console.log('   👉 PASS: FLAT500 applied and calculated correct savings.');

    // Test Case 1b: Minimum order constraint
    const res1b = await CouponEngine.validate('FLAT500', normalUser._id.toString(), {
      cartTotal: 800,
      items: [
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 800, category: 'Frames', brand: 'Glaze' }
      ]
    });
    assert.strictEqual(res1b.valid, false, 'FLAT500 should be invalid for cart total 800 (min 1000)');
    console.log('   👉 PASS: FLAT500 rejected cart value below threshold.');

    // ----------------------------------------------------
    // Test Case 2: Percent discount with capping
    // ----------------------------------------------------
    console.log('🧪 Running Test Case 2: Percentage Coupon with Cap (PERCENT20)');
    
    // 20% of 1000 = 200 (less than 300 cap)
    const res2a = await CouponEngine.validate('PERCENT20', normalUser._id.toString(), {
      cartTotal: 1000,
      items: [
        { productId: new mongoose.Types.ObjectId().toString(), qty: 2, price: 500, category: 'Frames', brand: 'Glaze' }
      ]
    });
    assert.strictEqual(res2a.valid, true);
    assert.strictEqual(res2a.discountAmount, 200);
    
    // 20% of 2000 = 400 (exceeds cap of 300)
    const res2b = await CouponEngine.validate('PERCENT20', normalUser._id.toString(), {
      cartTotal: 2000,
      items: [
        { productId: new mongoose.Types.ObjectId().toString(), qty: 2, price: 1000, category: 'Frames', brand: 'Glaze' }
      ]
    });
    assert.strictEqual(res2b.valid, true);
    assert.strictEqual(res2b.discountAmount, 300); // capped
    console.log('   👉 PASS: PERCENT20 calculated percentages and respected maximum caps.');

    // ----------------------------------------------------
    // Test Case 3: BOGO (Cheapest item free)
    // ----------------------------------------------------
    console.log('🧪 Running Test Case 3: BOGO discount (BUY1GET1)');
    const res3 = await CouponEngine.validate('BUY1GET1', normalUser._id.toString(), {
      cartTotal: 2500,
      items: [
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1500, category: 'Frames', brand: 'Ray-Ban', buy1Get1: true },
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1000, category: 'Frames', brand: 'Oakley', buy1Get1: true }
      ]
    });
    assert.strictEqual(res3.valid, true);
    assert.strictEqual(res3.discountAmount, 1000); // cheapest item (1000) should be free
    console.log('   👉 PASS: BOGO correctly identified and discounted cheapest eligible cart item.');

    // ----------------------------------------------------
    // Test Case 4: VIP Membership validation
    // ----------------------------------------------------
    console.log('🧪 Running Test Case 4: Membership Gated Coupon (GOLDVIP)');
    
    // Non-member check
    const res4a = await CouponEngine.validate('GOLDVIP', normalUser._id.toString(), {
      cartTotal: 1000,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1000 }]
    });
    assert.strictEqual(res4a.valid, false, 'Should fail for non-gold members');
    
    // Member check
    const res4b = await CouponEngine.validate('GOLDVIP', vipUser._id.toString(), {
      cartTotal: 1000,
      items: [{ productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1000 }]
    });
    assert.strictEqual(res4b.valid, true, 'Should pass for gold members');
    assert.strictEqual(res4b.discountAmount, 100);
    console.log('   👉 PASS: Membership criteria validated successfully.');

    // ----------------------------------------------------
    // Test Case 5: Exclusions List
    // ----------------------------------------------------
    console.log('🧪 Running Test Case 5: Category Exclusions Check (NOCATEGORY)');
    const res5 = await CouponEngine.validate('NOCATEGORY', normalUser._id.toString(), {
      cartTotal: 2000,
      items: [
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1200, category: 'Sunglasses' }, // Ineligible
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 800, category: 'Lenses' } // Eligible
      ]
    });
    assert.strictEqual(res5.valid, true);
    // 15% discount should only apply to 'Lenses' (800) -> 120
    assert.strictEqual(res5.discountAmount, 120);
    console.log('   👉 PASS: Exclusions lists applied correctly to individual item levels.');
    // ----------------------------------------------------
    // Test Case 6: Virtual BOGO Coupon (BOGO)
    // ----------------------------------------------------
    console.log('🧪 Running Test Case 6: Virtual BOGO for Members (BOGO)');
    const res6 = await CouponEngine.validate('BOGO', vipUser._id.toString(), {
      cartTotal: 2500,
      addGoldMembership: true,
      items: [
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1500, category: 'Frames', brand: 'Ray-Ban', buy1Get1: true },
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1, price: 1000, category: 'Frames', brand: 'Oakley', buy1Get1: true }
      ]
    });
    assert.strictEqual(res6.valid, true);
    assert.strictEqual(res6.discountAmount, 1000);
    console.log('   👉 PASS: Virtual BOGO validated and applied correctly.');

    console.log('\n🎉 ALL TEST CASES PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Test execution encountered a failure:', error);
    process.exit(1);
  } finally {
    // Teardown
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('🧹 Test database cleaned and shut down.');
  }
}

runTests();
