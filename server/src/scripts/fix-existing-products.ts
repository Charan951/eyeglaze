import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

const ProductSchema = new mongoose.Schema({
  buy1Get1: { type: Boolean },
  oneRupeeFrameOffer: { type: Boolean }
}, { strict: false });

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  const Product = mongoose.model('Product', ProductSchema);

  // Find products with both enabled
  const products = await Product.find({ buy1Get1: true, oneRupeeFrameOffer: true });
  console.log(`Found ${products.length} products with both offers enabled.`);

  for (const prod of products) {
    console.log(`Updating product: ${prod.get('name')} (SKU: ${prod.get('sku')})`);
    prod.set('oneRupeeFrameOffer', false);
    await prod.save();
    console.log('Updated successfully!');
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(console.error);
