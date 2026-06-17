import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import { connectDB } from '../config/mongodb';

// Inline User schema definition
const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true, sparse: true },
    mobile: { type: String, unique: true, sparse: true },
    countryCode: { type: String, default: '+91' },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    password: { type: String },
    otp: String,
    otpExpiry: Date,
    isVerified: { type: Boolean, default: false },
    name: String,
    role: { type: String, enum: ['user', 'admin', 'customer', 'store_manager', 'support_agent'], default: 'user' },
    addresses: [],
    wishlist: [],
    membershipActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

async function main() {
  console.log('Connecting to MongoDB...');
  await connectDB();
  console.log('Connected!');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';

  console.log(`Seeding admin user (${adminEmail})...`);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await User.findOneAndUpdate(
    { role: 'admin' },
    {
      mobile: '9999999999',
      phone: '9999999999',
      countryCode: '+91',
      email: adminEmail.toLowerCase(),
      password: adminPasswordHash,
      role: 'admin',
      name: 'EyeGlaze Admin',
      isVerified: true,
    },
    { upsert: true, new: true }
  );

  console.log('Admin user seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Admin seed failed:', err);
  process.exit(1);
});
