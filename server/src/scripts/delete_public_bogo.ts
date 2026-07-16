import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/mongodb';
import { Coupon } from '../models/Coupon';

dotenv.config();

async function main() {
  await connectDB();
  const deleted = await Coupon.deleteMany({ code: 'BUY1GET1' });
  console.log(`Deleted ${deleted.deletedCount} public BOGO coupon(s).`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
