import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { createOrder } from '../controllers/orders.controller';

// We will construct a fake request/response to run createOrder manually and catch errors
async function main() {
  await connectDB();
  const user = await User.findOne({ email: 'n@gmail.com' });
  if (!user) {
    console.log('User not found');
    await mongoose.disconnect();
    return;
  }

  // Get naga's cart items
  const cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    console.log('Cart not found');
    await mongoose.disconnect();
    return;
  }

  console.log(`Naga's Cart has ${cart.items.length} items.`);

  // Simulate createOrder
  const req = {
    user: { userId: user._id.toString() },
    body: {
      deliveryAddress: {
        fullName: 'naga',
        mobile: '9010894155',
        alternativeNumber: '6305804155',
        line1: 'vucvh',
        line2: 'NLV J',
        city: 'HYD',
        state: 'HYD',
        pincode: '500072'
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      walletUsed: 0,
      activateMembership: false,
      applyBogo: false
    }
  } as any;

  let statusCode: number | null = null;
  let jsonResponse: any = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      jsonResponse = data;
      return this;
    }
  } as any;

  try {
    await createOrder(req, res);
    console.log(`Result Status: ${statusCode}`);
    console.log('Result JSON:', JSON.stringify(jsonResponse, null, 2));
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
