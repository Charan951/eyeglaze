import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Cart } from '../models/Cart';

async function main() {
  await connectDB();
  // Register schemas
  const _u = User.modelName;
  const _p = Product.modelName;
  
  const carts = await Cart.find().populate('user');
  console.log(`FOUND ${carts.length} CARTS IN DB:`);
  for (const c of carts) {
    const userEmail = (c.user as any)?.email || 'Unknown';
    console.log(`- Cart id=${c._id}, user=${userEmail}, itemsCount=${c.items.length}`);
    c.items.forEach((item: any, idx: number) => {
      console.log(`   item ${idx+1}: product=${item.product}, qty=${item.qty}`);
    });
  }
  await mongoose.disconnect();
}

main().catch(console.error);
