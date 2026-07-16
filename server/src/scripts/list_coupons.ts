import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/mongodb';
import { Coupon } from '../models/Coupon';

dotenv.config();

async function main() {
  await connectDB();
  const coupons = await Coupon.find({});
  console.log('--- ALL COUPONS IN DB ---');
  coupons.forEach(c => {
    console.log(`Code: ${c.code}, Type: ${c.discountType}, Active: ${c.isActive}, userSpecific: ${c.userSpecific || 'None'}`);
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
