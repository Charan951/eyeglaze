import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Product } from '../models/Product';

async function run() {
  await connectDB();
  console.log("CONNECTED TO MONGO");

  const product = await Product.findById('6a39ffe5798a092662d5c5e2');
  if (!product) {
    console.log("Product not found");
    process.exit(1);
  }

  console.log("Existing dynamicLensPricing:", product.dynamicLensPricing);

  // Try updating dynamicLensPricing
  product.dynamicLensPricing = [
    {
      lensName: 'charan',
      lensCategory: 'Single Vision',
      regularPrice: 200,
      goldPrice: 180,
      platinumPrice: 160,
      priority: 0,
      status: 'Active'
    }
  ];

  await product.save();
  console.log("Product saved successfully!");

  const updatedProd = await Product.findById('6a39ffe5798a092662d5c5e2');
  console.log("Updated dynamicLensPricing:", updatedProd?.dynamicLensPricing);

  process.exit(0);
}

run();
