import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';

async function main() {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: 'l@gmail.com' },
    {
      $set: {
        oneRupeeOfferCount: 1,
        oneRupeeOfferUsed: false,
      }
    },
    { new: true }
  );
  console.log('UPDATED USER DETAILS:', {
    email: user?.email,
    membershipActive: user?.membershipActive,
    oneRupeeOfferUsed: user?.oneRupeeOfferUsed,
    oneRupeeOfferCount: user?.oneRupeeOfferCount,
  });
  await mongoose.disconnect();
}

main().catch(console.error);
