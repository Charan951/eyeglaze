import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

const ProductSchema = new mongoose.Schema({}, { strict: false });
const LensTypeSchema = new mongoose.Schema({
  name: String,
  category: String,
  status: String,
}, { timestamps: true });

const LensSchema = new mongoose.Schema({
  name: String,
  lensType: { type: mongoose.Schema.Types.ObjectId, ref: 'LensType' },
  basePrice: Number,
  status: String,
}, { strict: false });

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  const Product = mongoose.model('Product', ProductSchema);
  const LensType = mongoose.model('LensType', LensTypeSchema);
  const Lens = mongoose.model('Lens', LensSchema);

  const product = await Product.findOne({ name: /Vikas/i });
  console.log('--- PRODUCT ---');
  if (product) {
    console.log('Name:', product.get('name'));
    console.log('lensTypes field:', product.get('lensTypes'));
    console.log('compatible field:', product.get('compatible'));
    console.log('compatibleLensTypes field:', product.get('compatibleLensTypes'));
  }

  console.log('--- ALL LENS TYPES IN DATABASE ---');
  const allLensTypes = await LensType.find();
  for (const lt of allLensTypes) {
    console.log(`ID: ${lt._id}, Name: ${lt.name}, Category: ${lt.category}, Status: ${lt.status}`);
  }

  console.log('--- LENS TYPES FOR VIKAS ---');
  if (product && product.get('lensTypes')) {
    for (const id of product.get('lensTypes')) {
      const lt = await LensType.findById(id);
      if (lt) {
        console.log(`ID: ${lt._id}, Name: ${lt.name}, Category: ${lt.category}, Status: ${lt.status}`);
      } else {
        console.log(`ID: ${id} -> NULL`);
      }
    }
  }

  console.log('--- LENSES CONFIGURED FOR VIKAS LENS TYPES ---');
  if (product && product.get('lensTypes')) {
    const lenses = await Lens.find({ lensType: { $in: product.get('lensTypes') } }).populate('lensType');
    for (const l of lenses) {
      console.log(`Lens ID: ${l._id}, Name: ${l.name}, Type Name: ${(l.get('lensType') as any)?.name}, Price: ${l.get('basePrice')}, Status: ${l.get('status')}`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
