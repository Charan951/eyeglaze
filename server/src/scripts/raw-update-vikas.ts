import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  const productsCollection = db.collection('products');

  const vikasBefore = await productsCollection.findOne({ name: /Vikas/i });
  console.log('Vikas before raw update:', {
    name: vikasBefore?.name,
    buy1Get1: vikasBefore?.buy1Get1,
    oneRupeeFrameOffer: vikasBefore?.oneRupeeFrameOffer
  });

  const res = await productsCollection.updateOne(
    { name: /Vikas/i },
    { $set: { buy1Get1: true, oneRupeeFrameOffer: true } }
  );
  console.log('Raw update result:', res);

  const vikasAfter = await productsCollection.findOne({ name: /Vikas/i });
  console.log('Vikas after raw update:', {
    name: vikasAfter?.name,
    buy1Get1: vikasAfter?.buy1Get1,
    oneRupeeFrameOffer: vikasAfter?.oneRupeeFrameOffer
  });

  await mongoose.disconnect();
}

run().catch(console.error);
