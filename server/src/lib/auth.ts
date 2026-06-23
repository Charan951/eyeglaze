import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'eyeglaze_dev_secret_change_in_production';
const ACCESS_COOKIE_NAME = 'eyeglaze_access';
const REFRESH_COOKIE_NAME = 'eyeglaze_refresh';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes in ms
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface JWTPayload {
  userId: string;
  role: string;
}

export interface JWTRefreshPayload {
  userId: string;
  role: string;
  sessionId: string;
  jti?: string;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function signRefreshToken(payload: JWTRefreshPayload): string {
  const uniquePayload = {
    ...payload,
    jti: crypto.randomBytes(16).toString('hex'),
  };
  return jwt.sign(uniquePayload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): JWTRefreshPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTRefreshPayload;
  } catch {
    return null;
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/',
  });
}

export function clearAuthCookies(res: Response): void {
  res.cookie(ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  res.cookie(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME };
