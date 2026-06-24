import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/mongodb';
import { Coupon } from '../models/Coupon';

dotenv.config();

const dummyCoupons = [
  {
    code: 'EYEGOLD50',
    name: '50% OFF FRAMES',
    description: 'Get up to 50% discount on select luxury aviators and prescription frames. Limited stock!',
    badge: 'Bestseller',
    discountType: 'percent',
    discountValue: 50,
    minOrderValue: 999,
    maxDiscount: 1000,
    isActive: true,
  },
  {
    code: 'FREECOAT',
    name: 'FREE ANTI-GLARE COATING',
    description: 'Upgrade your prescription glasses with anti-reflective and water-repellent coatings for free.',
    badge: 'Premium',
    discountType: 'flat',
    discountValue: 699,
    minOrderValue: 1499,
    isActive: true,
  },
  {
    code: 'WELCOME200',
    name: '₹200 NEW USER DISCOUNT',
    description: 'Place your first order to get flat ₹200 off. Valid on minimum cart value of ₹999.',
    badge: 'Welcome',
    discountType: 'flat',
    discountValue: 200,
    minOrderValue: 999,
    isActive: true,
  },
];

async function main() {
  console.log('Connecting to MongoDB...');
  await connectDB();
  console.log('Connected!');

  console.log('Clearing existing coupons...');
  await Coupon.deleteMany({});

  console.log('Inserting dummy coupons...');
  for (const couponData of dummyCoupons) {
    const coupon = new Coupon({
      ...couponData,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
    });
    await coupon.save();
    console.log(`Seeded coupon: ${coupon.code}`);
  }

  console.log('Dummy coupons seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Coupon seed failed:', err);
  process.exit(1);
});
