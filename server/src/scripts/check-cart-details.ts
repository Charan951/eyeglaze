import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

const CartSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });
const OrderSchema = new mongoose.Schema({}, { strict: false });

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Cart = mongoose.model('Cart', CartSchema);
  const User = mongoose.model('User', UserSchema);
  const Order = mongoose.model('Order', OrderSchema);

  // Find all carts
  const carts = await Cart.find({});
  console.log(`Found ${carts.length} carts:`);
  for (const cart of carts) {
    const userId = cart.get('user');
    const user = await User.findById(userId);
    const prevOrders = await Order.countDocuments({ user: userId, status: { $ne: 'cancelled' } });
    
    console.log('\n--- CART ---');
    console.log('Cart ID:', cart._id);
    console.log('User ID:', userId);
    console.log('User Name:', user?.get('name'));
    console.log('User Email:', user?.get('email'));
    console.log('User membershipActive:', user?.get('membershipActive'));
    console.log('User oneRupeeOfferUsed:', user?.get('oneRupeeOfferUsed'));
    console.log('User oneRupeeOfferCount:', user?.get('oneRupeeOfferCount'));
    console.log('Add Gold Membership in Cart:', cart.get('addGoldMembership'));
    console.log('Previous Orders:', prevOrders);
    console.log('Cart Items:', JSON.stringify(cart.get('items'), null, 2));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
