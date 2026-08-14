import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { SiteSettings } from '../../models/SiteSettings';
import { clearCachePattern } from '../../middleware/cache';
import { getIO } from '../../lib/socket';
import { normalizeMembershipPrice } from '../../lib/membership';

export async function getAdminSettings(req: Request, res: Response) {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    return res.status(200).json({ settings });
  } catch (error) {
    console.error('getAdminSettings error:', error);
    return res.status(500).json({ error: 'Failed to fetch site settings' });
  }
}

export async function updateAdminSettings(req: Request, res: Response) {
  try {
    await connectDB();
    const { contactEmail, contactPhone, contactPhoneLabel, address, socialLinks, membershipPrice } = req.body || {};

    const update: Record<string, any> = {};
    if (contactEmail !== undefined) update.contactEmail = contactEmail;
    if (contactPhone !== undefined) update.contactPhone = contactPhone;
    if (contactPhoneLabel !== undefined) update.contactPhoneLabel = contactPhoneLabel;
    if (address !== undefined) update.address = address;
    if (Array.isArray(socialLinks)) {
      update.socialLinks = socialLinks
        .filter((s: any) => s && s.platform && s.url)
        .map((s: any) => ({ platform: String(s.platform), url: String(s.url) }));
    }
    if (membershipPrice !== undefined) {
      const parsed = Number(membershipPrice);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ error: 'Membership price must be a positive number.' });
      }
      update.membershipPrice = normalizeMembershipPrice(parsed);
    }

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(update);
    } else {
      Object.assign(settings, update);
      await settings.save();
    }

    await clearCachePattern('cache:/api/settings*');
    getIO().emit('settings_changed', { membershipPrice: settings.membershipPrice });
    return res.status(200).json({ settings });
  } catch (error) {
    console.error('updateAdminSettings error:', error);
    return res.status(500).json({ error: 'Failed to update site settings' });
  }
}
