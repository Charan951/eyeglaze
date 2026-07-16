import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Order } from '../models/Order';

async function main() {
  await connectDB();
  const users = await User.find();
  console.log(`Found ${users.length} users in database.`);
  
  for (const user of users) {
    if (user.addresses.length === 0) {
      // Find latest order for this user
      const latestOrder = await Order.findOne({ user: user._id }).sort({ createdAt: -1 });
      if (latestOrder && latestOrder.address) {
        user.addresses.push({
          fullName: latestOrder.address.fullName,
          mobile: latestOrder.address.mobile,
          alternativeNumber: latestOrder.address.alternativeNumber,
          pincode: latestOrder.address.pincode,
          line1: latestOrder.address.line1,
          line2: latestOrder.address.line2,
          city: latestOrder.address.city,
          state: latestOrder.address.state,
          type: 'Home',
          isDefault: true
        } as any);
        await user.save();
        console.log(`Successfully migrated shipping address for user: ${user.email}`);
      }
    } else {
      console.log(`User ${user.email} already has ${user.addresses.length} address(es).`);
    }
  }
  await mongoose.disconnect();
}

main().catch(console.error);
