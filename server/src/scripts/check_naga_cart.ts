import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Cart } from '../models/Cart';

async function main() {
  await connectDB();
  const user = await User.findOne({ email: 'n@gmail.com' });
  if (!user) {
    console.log('User not found');
    await mongoose.disconnect();
    return;
  }
  const cart = await Cart.findOne({ user: user._id });
  console.log('USER DETAILS:', {
    _id: user._id,
    name: user.name,
    email: user.email,
    membershipActive: user.membershipActive,
    oneRupeeOfferUsed: user.oneRupeeOfferUsed,
    oneRupeeOfferCount: user.oneRupeeOfferCount,
  });
  console.log('CART DETAILS:', {
    _id: cart?._id,
    itemsCount: cart?.items?.length,
    items: cart?.items,
  });
  await mongoose.disconnect();
}

main().catch(console.error);
