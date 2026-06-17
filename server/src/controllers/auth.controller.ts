import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
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
        { upsert: true, new: true }
      );
      await sendSMSOTP(phoneNum, countryCode, otp);
    } else {
      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { email: email.toLowerCase(), otp: otpHash, otpExpiry },
        { upsert: true, new: true }
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
        addresses: user.addresses,
        wishlist: user.wishlist,
      },
    });
  } catch (error) {
    console.error('me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
