import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/mongodb';
import { Coupon } from '../models/Coupon';

dotenv.config();

// Default values if not provided via command line arguments
// Usage: npx tsx src/scripts/addCoupon.ts CODE NAME VALUE MIN_ORDER TYPE
// Example: npx tsx src/scripts/addCoupon.ts SUMMER300 "Summer Cool discount" 300 1500 flat
const args = process.argv.slice(2);

const code = args[0] || 'SUMMERCOOL';
const name = args[1] || 'Summer Cool Discount';
const discountValue = parseFloat(args[2] || '300');
const minOrderValue = parseFloat(args[3] || '1200');
const discountType = (args[4] || 'flat') as any; // 'percent' | 'flat' | 'bogo' etc.
const description = args[5] || `Get ₹${discountValue} discount on your order. Valid on purchase above ₹${minOrderValue}.`;

async function main() {
  console.log('⚡ Starting Promotion Seeder Script...');
  console.log('Connecting to MongoDB...');
  await connectDB();
  console.log('Connected successfully!');

  const uppercaseCode = code.toUpperCase().trim();

  // Check if coupon already exists
  const existing = await Coupon.findOne({ code: uppercaseCode, isDeleted: false });
  if (existing) {
    console.log(`❌ Error: Coupon with code "${uppercaseCode}" already exists in the database.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const validFrom = new Date();
  const validTo = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days validity

  const newPromo = new Coupon({
    code: uppercaseCode,
    name,
    description,
    badge: 'Limited',
    discountType,
    discountValue,
    minOrderValue,
    couponType: 'Standard',
    validFrom,
    validTo,
    isActive: true,
    autoApply: false,
    priority: 1,
    exclusive: true,
    usageLimitPerUser: 1,
    usageLimitTotal: 1000,
  });

  await newPromo.save();
  console.log(`\n🎉 SUCCESS: Added New Promotion Code!`);
  console.log(`-----------------------------------`);
  console.log(`🎫 Code:         ${newPromo.code}`);
  console.log(`🏷️ Name:         ${newPromo.name}`);
  console.log(`📝 Description:  ${newPromo.description}`);
  console.log(`💰 Discount:     ${newPromo.discountValue} (${newPromo.discountType})`);
  console.log(`🛒 Min Order:    ₹${newPromo.minOrderValue}`);
  console.log(`📅 Valid From:   ${newPromo.validFrom.toDateString()}`);
  console.log(`📅 Valid To:     ${newPromo.validTo.toDateString()}`);
  console.log(`-----------------------------------\n`);

  await mongoose.disconnect();
  console.log('Database disconnected.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
