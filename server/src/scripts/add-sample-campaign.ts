
import 'dotenv/config';
import { connectDB } from '../config/mongodb';
import { CashbackCampaign } from '../models/CashbackCampaign';

const sampleCampaign = {
  "name": "Summer Cashback 2024",
  "description": "Get ₹200 cashback on orders over ₹1500",
  "minOrderValue": 1500,
  "cashbackAmount": 200,
  "isActive": true,
  "sortOrder": 1
};

async function addSampleCampaign() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const existing = await CashbackCampaign.findOne({ name: sampleCampaign.name });
    if (existing) {
      console.log('Campaign already exists!');
      process.exit(0);
    }

    const campaign = new CashbackCampaign(sampleCampaign);
    await campaign.save();
    console.log('Campaign added successfully!');
    console.log('Campaign ID:', campaign._id);
    process.exit(0);
  } catch (error) {
    console.error('Error adding campaign:', error);
    process.exit(1);
  }
}

addSampleCampaign();
