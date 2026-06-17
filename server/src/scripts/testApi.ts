import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { getOrderById } from '../controllers/orders.controller';
import '../middleware/requireAuth';

const MONGODB_URI = 'mongodb+srv://eye:123@cluster0.reo9he2.mongodb.net/?appName=Cluster0';

async function test() {
  console.log('Connecting to database...');
  process.env.MONGODB_URI = MONGODB_URI;
  await connectDB();
  console.log('Connected!');

  const req = {
    params: {
      id: '6a3101228937587ee68b4d2c'
    },
    user: {
      userId: '6a30f027dc02afc2e5588f6f',
      role: 'admin'
    }
  } as any;

  const res = {
    status(code: number) {
      console.log('Response Status:', code);
      return this;
    },
    json(data: any) {
      console.log('Response JSON:', JSON.stringify(data, null, 2));
      return this;
    }
  } as any;

  try {
    await getOrderById(req, res);
  } catch (err) {
    console.error('Error during execution:', err);
  }

  await mongoose.disconnect();
}

test().catch(console.error);
