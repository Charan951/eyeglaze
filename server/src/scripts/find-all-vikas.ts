import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) return;
  const products = await db.collection('products').find({ name: /Vikas/i }).toArray();
  console.log(`Found ${products.length} products with "Vikas" in name:`);
  products.forEach(p => {
    console.log({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      buy1Get1: p.buy1Get1,
      oneRupeeFrameOffer: p.oneRupeeFrameOffer
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
