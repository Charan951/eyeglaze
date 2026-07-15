import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const { Cart } = require('../models/Cart');
  const cart = await Cart.findOne({});
  if (cart) {
    console.log('Found cart:', cart._id);
    console.log('Current addGoldMembership:', cart.addGoldMembership);
    cart.addGoldMembership = true;
    await cart.save();
    console.log('Successfully saved cart with addGoldMembership = true!');
    
    cart.addGoldMembership = false;
    await cart.save();
    console.log('Successfully reset cart with addGoldMembership = false!');
  } else {
    console.log('No cart found in database.');
  }

  await mongoose.disconnect();
  console.log('Disconnected');
}

run().catch(console.error);
