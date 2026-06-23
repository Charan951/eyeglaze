import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Product } from '../models/Product';

async function run() {
  await connectDB();
  console.log("CONNECTED TO MONGO");

  const id = '6a39ffe5798a092662d5c5e2';
  
  // Clear first
  await Product.findByIdAndUpdate(id, { $set: { dynamicLensPricing: [] } });
  
  const updateBody = {
    dynamicLensPricing: [
      {
        lensName: 'charan-api-test',
        lensCategory: 'Single Vision',
        regularPrice: 250,
        goldPrice: 220,
        platinumPrice: 200,
        priority: 0,
        status: 'Active'
      }
    ]
  };

  const product = await Product.findByIdAndUpdate(id, { $set: updateBody }, { returnDocument: 'after' });
  console.log("Updated Product:", product?.name);
  console.log("dynamicLensPricing after findByIdAndUpdate:", product?.dynamicLensPricing);

  process.exit(0);
}

run();
