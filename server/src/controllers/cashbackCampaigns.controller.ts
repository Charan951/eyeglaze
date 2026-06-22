import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { CashbackCampaign } from '../models/CashbackCampaign';
import { requireAdmin } from '../middleware/requireAdmin';

export async function getCashbackCampaigns(req: Request, res: Response) {
  try {
    await connectDB();
    const campaigns = await CashbackCampaign.find({ isActive: true }).sort({ sortOrder: 1 });
    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('GET cashback campaigns error:', error);
    return res.status(500).json({ error: 'Failed to fetch cashback campaigns' });
  }
}

export async function createCashbackCampaign(req: Request, res: Response) {
  try {
    await connectDB();
    const campaign = new CashbackCampaign(req.body);
    await campaign.save();
    return res.status(201).json({ campaign });
  } catch (error) {
    console.error('POST cashback campaign error:', error);
    return res.status(500).json({ error: 'Failed to create cashback campaign' });
  }
}

export async function updateCashbackCampaign(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const campaign = await CashbackCampaign.findByIdAndUpdate(id, req.body, { new: true });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.status(200).json({ campaign });
  } catch (error) {
    console.error('PUT cashback campaign error:', error);
    return res.status(500).json({ error: 'Failed to update cashback campaign' });
  }
}

export async function deleteCashbackCampaign(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    await CashbackCampaign.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('DELETE cashback campaign error:', error);
    return res.status(500).json({ error: 'Failed to delete cashback campaign' });
  }
}
