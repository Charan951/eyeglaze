import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { generateOTP, hashOTP, verifyOTP as verifyOTPHelper, signJWT, setAuthCookie, clearAuthCookie } from '../lib/auth';
import { sendSMSOTP, sendEmailOTP } from '../lib/otp-sender';
import bcrypt from 'bcryptjs';

export async function sendOTP(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const { phone, mobile, email, countryCode = '+91' } = body;

    const phoneNum = phone || mobile;

    if (!phoneNum && !email) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }

    await connectDB();

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (phoneNum) {
      await User.findOneAndUpdate(
        { $or: [{ phone: phoneNum }, { mobile: phoneNum }] },
        { phone: phoneNum, mobile: phoneNum, countryCode, otp: otpHash, otpExpiry },
        { upsert: true, returnDocument: 'after' }
      );
      await sendSMSOTP(phoneNum, countryCode, otp);
    } else {
      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { email: email.toLowerCase(), otp: otpHash, otpExpiry },
        { upsert: true, returnDocument: 'after' }
      );
      await sendEmailOTP(email, otp);
    }

    return res.status(200).json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('send-otp error:', error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}

export async function verifyOTP(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const { phone, mobile, email, otp } = body;

    const phoneNum = phone || mobile;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    if (!phoneNum && !email) {
      return res.status(400).json({ error: 'Phone or email is required' });
    }

    await connectDB();

    let user;
    if (phoneNum) {
      user = await User.findOne({ $or: [{ phone: phoneNum }, { mobile: phoneNum }] });
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const isValid = await verifyOTPHelper(otp, user.otp);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect OTP' });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    if (!user.termsAcceptedAt) {
      user.termsAcceptedAt = new Date();
    }
    await user.save();

    const token = signJWT({ userId: user._id.toString(), role: user.role });

    setAuthCookie(res, token);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('verify-otp error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
      isVerified: true,
    });

    const token = signJWT({ userId: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account does not have a password set. Please log in using OTP.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signJWT({ userId: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.status(200).json({ success: true });
}

export async function getMe(req: Request, res: Response) {
  try {
    await connectDB();
    const user = await User.findById(req.user!.userId).select('-otp -otpExpiry');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        role: user.role,
        membershipActive: user.membershipActive,
        membershipExpiry: user.membershipExpiry,
        addresses: user.addresses,
        wishlist: user.wishlist,
        walletBalance: user.walletBalance ?? 0,
        savedCards: user.savedCards ?? [],
        linkedWallets: user.linkedWallets ?? [],
        transactions: user.transactions ?? [],
      },
    });
  } catch (error) {
    console.error('me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const { name, email, phone, mobile } = req.body || {};
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (phone !== undefined) {
      user.phone = phone;
      user.mobile = phone;
    }
    if (mobile !== undefined) {
      user.mobile = mobile;
      user.phone = mobile;
    }

    await user.save();
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        role: user.role,
        membershipActive: user.membershipActive,
        addresses: user.addresses,
        wishlist: user.wishlist,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or phone number already in use' });
    }
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function addAddress(req: Request, res: Response) {
  try {
    const { fullName, mobile, pincode, line1, line2, city, state, type, isDefault } = req.body || {};
    if (!fullName || !mobile || !pincode || !line1 || !city || !state) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const setAsDefault = isDefault || user.addresses.length === 0;
    if (setAsDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      fullName,
      mobile,
      pincode,
      line1,
      line2,
      city,
      state,
      type: type || 'Home',
      isDefault: setAsDefault,
    });

    await user.save();
    return res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Add address error:', error);
    return res.status(500).json({ error: 'Failed to add address' });
  }
}

export async function updateAddress(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { fullName, mobile, pincode, line1, line2, city, state, type, isDefault } = req.body || {};
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.find((addr: any) => addr._id?.toString() === id);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (fullName !== undefined) address.fullName = fullName;
    if (mobile !== undefined) address.mobile = mobile;
    if (pincode !== undefined) address.pincode = pincode;
    if (line1 !== undefined) address.line1 = line1;
    if (line2 !== undefined) address.line2 = line2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (type !== undefined) address.type = type;

    if (isDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = addr._id?.toString() === id;
      });
    }

    await user.save();
    return res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Update address error:', error);
    return res.status(500).json({ error: 'Failed to update address' });
  }
}

export async function deleteAddress(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex((addr: any) => addr._id?.toString() === id);
    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({ error: 'Failed to delete address' });
  }
}

export async function setDefaultAddress(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.find((addr: any) => addr._id?.toString() === id);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    user.addresses.forEach((addr: any) => {
      addr.isDefault = addr._id?.toString() === id;
    });

    await user.save();
    return res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('Set default address error:', error);
    return res.status(500).json({ error: 'Failed to set default address' });
  }
}

export async function addCard(req: Request, res: Response) {
  try {
    const { number, name, expiry, type, bgClass } = req.body || {};
    if (!number || !name || !expiry || !type || !bgClass) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.savedCards.push({ number, name, expiry, type, bgClass });
    await user.save();
    return res.status(200).json({ success: true, savedCards: user.savedCards });
  } catch (error) {
    console.error('Add card error:', error);
    return res.status(500).json({ error: 'Failed to add card' });
  }
}

export async function deleteCard(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const cardIndex = user.savedCards.findIndex((c: any) => c._id?.toString() === id);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }
    user.savedCards.splice(cardIndex, 1);
    await user.save();
    return res.status(200).json({ success: true, savedCards: user.savedCards });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ error: 'Failed to delete card' });
  }
}

export async function toggleWallet(req: Request, res: Response) {
  try {
    const { walletId } = req.params;
    const { linked, emailOrPhone } = req.body || {};
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.linkedWallets || user.linkedWallets.length === 0) {
      user.linkedWallets = [
        { walletId: 'gpay', name: 'Google Pay', icon: '🔍', linked: false },
        { walletId: 'phonepe', name: 'PhonePe', icon: '📱', linked: false },
        { walletId: 'paytm', name: 'Paytm Wallet', icon: '💸', linked: false },
        { walletId: 'applepay', name: 'Apple Pay', icon: '🍎', linked: false },
      ];
    }

    const wallet = user.linkedWallets.find((w: any) => w.walletId === walletId);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    wallet.linked = linked;
    wallet.emailOrPhone = linked ? emailOrPhone : undefined;

    await user.save();
    return res.status(200).json({ success: true, linkedWallets: user.linkedWallets });
  } catch (error) {
    console.error('Toggle wallet error:', error);
    return res.status(500).json({ error: 'Failed to update wallet link' });
  }
}

export async function addMoney(req: Request, res: Response) {
  try {
    const { amount, method } = req.body || {};
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.walletBalance = (user.walletBalance || 0) + numericAmount;
    user.transactions.push({
      type: 'Added',
      amount: numericAmount,
      date: new Date(),
      description: `Added via ${method === 'upi' ? 'UPI' : 'Saved Card'}`,
    });
    await user.save();
    return res.status(200).json({
      success: true,
      walletBalance: user.walletBalance,
      transactions: user.transactions,
    });
  } catch (error) {
    console.error('Add money error:', error);
    return res.status(500).json({ error: 'Failed to add money' });
  }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    await connectDB();
    const user = await User.findByIdAndDelete(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    clearAuthCookie(res);
    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}

export async function activateMembership(req: Request, res: Response) {
  try {
    await connectDB();
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.membershipActive) {
      return res.status(400).json({ error: 'Your Gold Membership is already active!' });
    }

    const { paymentMethod } = req.body || {};
    const membershipFee = 129;

    if (paymentMethod !== 'razorpay') {
      if ((user.walletBalance || 0) < membershipFee) {
        return res.status(400).json({
          error: `Insufficient wallet balance. You need ₹${membershipFee} in your wallet to purchase Gold Membership. Current balance: ₹${user.walletBalance || 0}`
        });
      }
      // Deduct the fee
      user.walletBalance = (user.walletBalance || 0) - membershipFee;
    }
    
    // Set membership fields
    user.membershipActive = true;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    user.membershipExpiry = expiry;

    // Add transaction record
    user.transactions.push({
      type: 'Paid',
      amount: membershipFee,
      date: new Date(),
      description: paymentMethod === 'razorpay' ? 'Gold Membership Activation (1 Year) via Razorpay' : 'Gold Membership Activation (1 Year)'
    });

    // Auto-generate 50% OFF member coupon
    const couponCode = `MEMBER${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const coupon = new Coupon({
      code: couponCode,
      discountType: 'percent',
      discountValue: 50,
      name: '50% Off Member Exclusive',
      description: 'Exclusive 50% off for members',
      isActive: true,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      usageLimitTotal: 1,
      userSpecific: user._id,
    });
    await coupon.save();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Gold Membership activated successfully!',
      coupon,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile,
        mobile: user.mobile,
        role: user.role,
        membershipActive: user.membershipActive,
        membershipExpiry: user.membershipExpiry,
        addresses: user.addresses,
        wishlist: user.wishlist,
        walletBalance: user.walletBalance,
        savedCards: user.savedCards ?? [],
        linkedWallets: user.linkedWallets ?? [],
        transactions: user.transactions ?? [],
      }
    });
  } catch (error) {
    console.error('activateMembership error:', error);
    return res.status(500).json({ error: 'Failed to activate membership' });
  }
}


