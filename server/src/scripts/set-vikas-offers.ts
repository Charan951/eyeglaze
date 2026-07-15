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

  // Find Vikas and set both true
  const product = await Product.findOne({ name: /Vikas/i });
  if (product) {
    console.log(`Updating product: ${product.get('name')} (SKU: ${product.get('sku')})`);
    product.set('buy1Get1', true);
    product.set('oneRupeeFrameOffer', true);
    await product.save();
    console.log('Updated successfully!');
  } else {
    console.log('Product Vikas not found!');
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(console.error);
