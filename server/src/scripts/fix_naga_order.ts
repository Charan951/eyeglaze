import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Order } from '../models/Order';

async function main() {
  await connectDB();
  const order = await Order.findOneAndUpdate(
    { orderId: 'EGO-20260716-0020' },
    {
      $set: {
        bogoApplied: true,
        discount: 2199,
        total: 2398,
      }
    },
    { new: true }
  );
  console.log('UPDATED NAGA ORDER DETAILS:', {
    orderId: order?.orderId,
    bogoApplied: order?.bogoApplied,
    discount: order?.discount,
    total: order?.total,
  });
  await mongoose.disconnect();
}

main().catch(console.error);
