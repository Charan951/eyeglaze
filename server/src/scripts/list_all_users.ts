import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Order } from '../models/Order';

async function main() {
  await connectDB();
  const users = await User.find();
  console.log(`FOUND ${users.length} USERS:`);
  
  for (const u of users) {
    const bogoOrdersCount = await Order.countDocuments({
      user: u._id,
      bogoApplied: true,
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' }
    });
    console.log(`- User: id=${u._id}, name=${u.name}, email=${u.email}, membership=${u.membershipActive}, bogoOrders=${bogoOrdersCount}`);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
