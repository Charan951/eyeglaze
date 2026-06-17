import dotenv from 'dotenv';
dotenv.config();

import { signJWT } from '../lib/auth';

const USER_ID = '6a30f027dc02afc2e5588f6f'; // User ID of admin@gmail.com from DB

async function run() {
  console.log('Generating auth token...');
  const token = signJWT({ userId: USER_ID, role: 'admin' });
  console.log('Token generated!');

  const url = 'http://localhost:5000/api/orders/6a3101228937587ee68b4d2c';
  console.log(`Sending request to ${url} ...`);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Request failed:', err.message);
  }
}

run().catch(console.error);
