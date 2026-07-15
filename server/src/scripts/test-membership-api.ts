import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.PORT || 5000;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  // Register models
  require('../models/Product');
  require('../models/User');
  require('../models/Cart');
  
  const { User } = require('../models/User');
  const user = await User.findOne({ email: 'krishnachitteti8@gmail.com' });
  if (!user) {
    console.log('User Krishna not found');
    await mongoose.disconnect();
    return;
  }

  // Sign token
  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  console.log('Generated token:', token.substring(0, 20) + '...');

  // Call GET /api/cart first
  const getRes = await fetch(`http://localhost:${PORT}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const getData = await getRes.json() as any;
  console.log('GET /api/cart status:', getRes.status);
  console.log('GET addGoldMembership:', getData?.cart?.addGoldMembership);

  // Call PUT /api/cart/membership
  console.log('Toggling to true...');
  const putRes = await fetch(`http://localhost:${PORT}/api/cart/membership`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ addGoldMembership: true })
  });
  const putData = await putRes.json() as any;
  console.log('PUT /api/cart/membership status:', putRes.status);
  console.log('PUT response body:', putData);

  // Call GET /api/cart again
  const getRes2 = await fetch(`http://localhost:${PORT}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const getData2 = await getRes2.json() as any;
  console.log('GET /api/cart after toggle status:', getRes2.status);
  console.log('GET addGoldMembership after toggle:', getData2?.cart?.addGoldMembership);

  // Reset it
  await fetch(`http://localhost:${PORT}/api/cart/membership`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ addGoldMembership: false })
  });
  console.log('Reset completed');

  await mongoose.disconnect();
  console.log('Disconnected');
}

run().catch(console.error);
