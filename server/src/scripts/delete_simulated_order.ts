import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Order } from '../models/Order';

async function main() {
  await connectDB();
  const deleted = await Order.deleteOne({ orderId: 'EGO-20260716-0021' });
  console.log('Deleted simulated order:', deleted);
  await mongoose.disconnect();
}

main().catch(console.error);
