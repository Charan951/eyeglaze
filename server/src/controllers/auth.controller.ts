import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import {
  generateOTP,
  hashOTP,
  verifyOTP as verifyOTPHelper,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME
} from '../lib/auth';
import { sendSMSOTP, sendEmailOTP } from '../lib/otp-sender';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Session } from '../models/Session';

async function createUserSession(req: Request, res: Response, user: any) {
  const sessionId = new mongoose.Types.ObjectId().toString();
  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role, sessionId });
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '';
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Session.create({
    _id: sessionId,
    userId: user._id,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  });

  setAuthCookies(res, accessToken, refreshToken);
}

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

    await createUserSession(req, res, user);
    return res.status(200).json({
      success: true,
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

    await createUserSession(req, res, user);

    return res.status(201).json({
      success: true,
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

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      return res.status(423).json({ error: `Account is temporarily locked. Try again in ${remainingMinutes} minute(s).` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();
        return res.status(423).json({ error: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.' });
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset failed attempts
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    await createUserSession(req, res, user);

    return res.status(200).json({
      success: true,
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

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload?.sessionId) {
        await connectDB();
        await Session.findByIdAndDelete(payload.sessionId);
      }
    }
  } catch (error) {
    console.error('Logout session deletion error:', error);
  }
  clearAuthCookies(res);
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
    clearAuthCookies(res);
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

export async function logoutAll(req: Request, res: Response) {
  try {
    await connectDB();
    await Session.deleteMany({ userId: req.user!.userId });
    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({ error: 'Failed to log out from all devices' });
  }
}

export async function getSessions(req: Request, res: Response) {
  try {
    await connectDB();
    await Session.deleteMany({ userId: req.user!.userId, expiresAt: { $lt: new Date() } });

    const sessions = await Session.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    let currentSessionId = '';
    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload) currentSessionId = payload.sessionId;
    }

    const formattedSessions = sessions.map(sess => ({
      id: sess._id,
      userAgent: sess.userAgent,
      ipAddress: sess.ipAddress,
      isCurrent: sess._id.toString() === currentSessionId,
      createdAt: sess.createdAt,
      expiresAt: sess.expiresAt,
    }));

    return res.status(200).json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
}

export async function revokeSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await connectDB();
    
    const session = await Session.findOne({ _id: id, userId: req.user!.userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    await Session.findByIdAndDelete(id);

    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload && payload.sessionId === id) {
        clearAuthCookies(res);
        return res.status(200).json({ success: true, loggedOutCurrent: true });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({ error: 'Failed to revoke session' });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    await connectDB();
    const session = await Session.findById(payload.sessionId);
    if (!session) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Session has been revoked' });
    }

    const presentedHash = crypto.createHash('sha256').update(token).digest('hex');
    
    if (session.refreshTokenHash !== presentedHash) {
      console.warn(`[SECURITY ALERT] Refresh token reuse detected for user ${payload.userId}. Revoking all sessions.`);
      await Session.deleteMany({ userId: payload.userId });
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Security breach detected. Please log in again.' });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'User no longer exists' });
    }

    const newAccessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role, sessionId: session._id.toString() });

    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    session.refreshTokenHash = newHash;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email is registered, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET EMAIL]`);
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`======================================================\n`);

    return res.status(200).json({ success: true, message: 'If that email is registered, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    await connectDB();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    await Session.deleteMany({ userId: user._id });

    return res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}


