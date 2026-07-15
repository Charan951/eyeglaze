import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  // Register all models first to avoid populate schema errors
  require('../models/Product');
  require('../models/User');
  require('../models/Cart');
  
  const { Cart } = require('../models/Cart');
  const carts = await Cart.find({}).populate('user', 'name email');
  for (const c of carts) {
    console.log(`Cart ID: ${c._id}, User: ${c.user?.name} (${c.user?.email}), addGoldMembership: ${c.addGoldMembership}, Items: ${c.items?.length}`);
  }

  await mongoose.disconnect();
  console.log('Disconnected');
}

run().catch(console.error);
