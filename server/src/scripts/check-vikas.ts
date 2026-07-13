import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

const ProductSchema = new mongoose.Schema({}, { strict: false });
const LensOptionSchema = new mongoose.Schema({}, { strict: false });

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  const Product = mongoose.model('Product', ProductSchema);
  const LensOption = mongoose.model('LensOption', LensOptionSchema);

  const product = await Product.findOne({ name: /Vikas/i });
  console.log('--- PRODUCT ---');
  console.log(JSON.stringify(product, null, 2));

  if (product) {
    const lensTypesList = product.get ? product.get('lensTypes') : (product as any).lensTypes;
    if (lensTypesList) {
      console.log('--- LENS TYPES ON PRODUCT ---');
      for (const lt of lensTypesList) {
        const typeDoc = await LensOption.findById(lt);
        console.log('ID:', lt, 'Doc:', typeDoc);
      }
    }
  }

  // Also query all lens types
  const allLensTypes = await LensOption.find({ kind: 'type' });
  console.log('--- ALL LENS TYPES ---');
  allLensTypes.forEach((lt: any) => {
    console.log(`ID: ${lt._id}, Name: ${lt.name}, Type: ${lt.type}, Kind: ${lt.kind}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
