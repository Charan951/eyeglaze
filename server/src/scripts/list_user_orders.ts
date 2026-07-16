import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Order } from '../models/Order';

async function main() {
  await connectDB();
  const user = await User.findOne({ email: 'l@gmail.com' });
  if (!user) {
    console.log('User not found');
    await mongoose.disconnect();
    return;
  }
  const orders = await Order.find({ user: user._id });
  console.log(`FOUND ${orders.length} ORDERS:`);
  orders.forEach(o => {
    console.log(`- Order ${o.orderId}: status=${o.status}, paymentStatus=${o.paymentStatus}, total=${o.total}, itemsCount=${o.items.length}`);
    o.items.forEach((item: any, idx: number) => {
      console.log(`   item ${idx+1}: name=${item.product?.name || item.name || 'Frame'}, qty=${item.qty}, framePrice=${item.framePrice}, lensPrice=${item.lensPrice}, appliedOffers=${item.appliedOffers}`);
    });
  });
  await mongoose.disconnect();
}

main().catch(console.error);
