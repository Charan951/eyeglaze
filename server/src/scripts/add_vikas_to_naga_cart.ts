import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Cart } from '../models/Cart';

async function main() {
  await connectDB();
  const user = await User.findOne({ email: 'n@gmail.com' });
  if (!user) {
    console.log('User not found');
    await mongoose.disconnect();
    return;
  }

  // Find the vikas product
  const product = await Product.findOne({ name: /vikas/i });
  if (!product) {
    console.log('Vikas product not found');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found Vikas Product: id=${product._id}, name=${product.name}`);

  // Create or find Naga's cart
  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    cart = new Cart({ user: user._id, items: [] });
  }

  // Add the two items as they appeared in naga's cart
  cart.items = [
    {
      product: product._id,
      qty: 1,
      color: 'Black',
      frameSize: 'Medium',
      lensType: 'single_vision',
      lensSubType: 'premium',
      power: {
        name: 'Order EGO-20260716-0020',
        RE: { sph: -0.25, cyl: -0.25, axis: 90 },
        LE: { sph: -0.25, cyl: -0.25, axis: 90 },
        pd: 64
      },
      lensQuality: 'Premium',
      lensPrice: 600,
      framePrice: 1599,
      fittingCharge: 99,
      deliveryCharge: 0,
      appliedOffers: []
    },
    {
      product: product._id,
      qty: 1,
      color: 'Black',
      frameSize: 'Medium',
      lensType: 'single_vision',
      lensSubType: 'premium',
      power: {
        name: 'Order EGO-20260716-0020',
        RE: { sph: -0.25, cyl: -0.25, axis: 90 },
        LE: { sph: -0.25, cyl: -0.25, axis: 90 },
        pd: 64
      },
      lensQuality: 'Premium',
      lensPrice: 600,
      framePrice: 1599,
      fittingCharge: 99,
      deliveryCharge: 0,
      appliedOffers: []
    }
  ] as any;

  cart.updatedAt = new Date();
  await cart.save();
  console.log("Successfully restored Naga's cart items!");

  await mongoose.disconnect();
}

main().catch(console.error);
