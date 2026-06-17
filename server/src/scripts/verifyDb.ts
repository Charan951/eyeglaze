import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/mongodb';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
});

async function main() {
  await connectDB();
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const users = await User.find({});
  console.log('--- Seeded Users in Database ---');
  console.log(users.map(u => ({ name: u.name, email: u.email, role: u.role })));
  await mongoose.disconnect();
}

main().catch(console.error);
