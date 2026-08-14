import { connectDB } from '../config/mongodb';
import { SiteSettings } from '../models/SiteSettings';

export const DEFAULT_MEMBERSHIP_PRICE = 129;

export function normalizeMembershipPrice(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_MEMBERSHIP_PRICE;
  return Math.round(n);
}

export async function getMembershipPrice(): Promise<number> {
  await connectDB();
  const settings = await SiteSettings.findOne().lean();
  return normalizeMembershipPrice(settings?.membershipPrice);
}
