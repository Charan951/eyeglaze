import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Order } from '../models/Order';

async function run() {
  // Force evaluation of imports so they are not stripped by TS compiler
  const _models = [Cart, Product, User, Order];
  console.log('Ensured models are loaded:', _models.map(m => m.modelName));

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = 'hhhy@gmail.com';
  const user = await User.findOne({ email });
  if (!user) {
    console.log(`User not found: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const cart = await Cart.findOne({ user: user._id }).populate(
    'items.product',
    'name images price sku frame colors memberPrice nonMemberPrice buy1Get1 oneRupeeFrameOffer'
  );

  if (!cart) {
    console.log(`Cart not found for user: ${email}`);
    await mongoose.disconnect();
    return;
  }

  console.log('Cart Items before calculation:', JSON.stringify(cart.items, null, 2));

  const previousOrderCount = await Order.countDocuments({
    user: user._id,
    status: { $ne: 'cancelled' }
  });

  // Calculate if BOGO is active
  const isMemberNow = user.membershipActive || cart.addGoldMembership;
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const bogoOrderThisMonth = await Order.findOne({
    user: user._id,
    bogoApplied: true,
    createdAt: { $gte: startOfMonth },
    status: { $ne: 'cancelled' },
    paymentStatus: { $ne: 'failed' }
  });

  const bogoAllowedForMember = !bogoOrderThisMonth;

  const totalBogoQty = cart.items.reduce((sum: number, item: any) => 
    (bogoAllowedForMember && (isMemberNow || item.product?.buy1Get1)) ? sum + item.qty : sum, 
    0
  );
  const isBogoActive = totalBogoQty >= 2;

  console.log('Calculation context:', {
    email,
    userId: user._id,
    userMembershipActive: user.membershipActive,
    cartAddGoldMembership: cart.addGoldMembership,
    isMemberNow,
    previousOrderCount,
    bogoAllowedForMember,
    totalBogoQty,
    isBogoActive,
    oneRupeeOfferUsed: user.oneRupeeOfferUsed,
    oneRupeeOfferCount: user.oneRupeeOfferCount
  });

  let oneRupeeFramesApplied = 0;
  const remainingOneRupeeFrames = Math.max(0, 2 - (user.oneRupeeOfferCount ?? 0));

  const processedItems = cart.items.map((item: any) => {
    let framePrice = item.product?.price?.selling ?? item.framePrice ?? 0;
    let appliedOffers: string[] = [];
    let isOneRupeeFrame = false;

    console.log(`Checking item product SKU: ${item.product?.sku}`, {
      oneRupeeFrameOffer: item.product?.oneRupeeFrameOffer,
      buy1Get1: item.product?.buy1Get1,
      price: item.product?.price
    });

    // Check ₹1 Frame eligibility
    const cond = !isBogoActive && item.product?.oneRupeeFrameOffer && isMemberNow && !user.oneRupeeOfferUsed && (user.oneRupeeOfferCount ?? 0) < 2 && oneRupeeFramesApplied < remainingOneRupeeFrames;
    
    console.log(`Condition components for ${item.product?.sku}:`, {
      notIsBogoActive: !isBogoActive,
      productOffer: item.product?.oneRupeeFrameOffer,
      isMemberNow,
      notUsed: !user.oneRupeeOfferUsed,
      countLessThan2: (user.oneRupeeOfferCount ?? 0) < 2,
      appliedLessThanRemaining: oneRupeeFramesApplied < remainingOneRupeeFrames,
      condResult: cond
    });

    if (cond) {
      const allowed = Math.min(item.qty, remainingOneRupeeFrames - oneRupeeFramesApplied);
      const regularPrice = item.product?.memberPrice !== undefined ? item.product.memberPrice : (item.product?.price?.selling ?? item.framePrice ?? 0);
      const totalFramePriceForQty = (allowed * 1) + ((item.qty - allowed) * regularPrice);
      framePrice = totalFramePriceForQty / item.qty;
      oneRupeeFramesApplied += allowed;
      isOneRupeeFrame = true;
      appliedOffers.push('₹1 Frame');
    } else if (item.product?.memberPrice && user.membershipActive) {
      framePrice = item.product.memberPrice;
      appliedOffers.push('Member Price');
    } else if (item.product?.nonMemberPrice && !user.membershipActive) {
      framePrice = item.product.nonMemberPrice;
    }

    return {
      productId: item.product?._id,
      sku: item.product?.sku,
      framePrice,
      appliedOffers,
      isOneRupeeFrame
    };
  });

  console.log('Processed items results:', processedItems);

  await mongoose.disconnect();
}

run().catch(console.error).then(() => process.exit(0));
