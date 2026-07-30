import { Request, Response } from 'express';
import { KidsAgeGroup } from '../../models/KidsAgeGroup';

const defaultAgeGroups = [
  {
    title: 'Kids On Sale',
    ageRange: 'Special Discounts',
    badgeText: 'Offer',
    subtitle: '1rs frame on',
    image: '/images/kids_special_edition.png',
    targetSize: 'Sale',
    colorTheme: 'rose',
    displayOrder: 1,
    status: 'Active',
  },
  {
    title: 'Juniors',
    ageRange: '5 to 8 years',
    badgeText: 'Juniors',
    subtitle: 'Fits Small Frames',
    image: '/images/kids_juniors_5_to_8.png',
    targetSize: 'Small',
    colorTheme: 'amber',
    displayOrder: 2,
    status: 'Active',
  },
  {
    title: 'Tweens',
    ageRange: '8 to 12 years',
    badgeText: 'Tweens',
    subtitle: 'Fits Medium Frames',
    image: '/images/kids_tweens_8_to_12.png',
    targetSize: 'Medium',
    colorTheme: 'cyan',
    displayOrder: 3,
    status: 'Active',
  },
  {
    title: 'Teens',
    ageRange: '12 to 17 years',
    badgeText: 'Teens',
    subtitle: 'Fits Youth Frames',
    image: '/images/kids_teens_12_to_17.png',
    targetSize: 'Large',
    colorTheme: 'purple',
    displayOrder: 4,
    status: 'Active',
  },
];

// Ensure initial seed if empty & update legacy default images
const ensureDefaultAgeGroups = async () => {
  const count = await KidsAgeGroup.countDocuments({ isDeleted: false });
  if (count === 0) {
    await KidsAgeGroup.insertMany(defaultAgeGroups);
  } else {
    await KidsAgeGroup.updateOne({ title: 'Kids On Sale', image: '/images/kids_eyeglasses.png' }, { image: '/images/kids_special_edition.png' });
    await KidsAgeGroup.updateOne({ title: 'Juniors', image: '/images/kids_eyeglasses.png' }, { image: '/images/kids_juniors_5_to_8.png' });
    await KidsAgeGroup.updateOne({ title: 'Tweens', image: '/images/kids_eyeglasses.png' }, { image: '/images/kids_tweens_8_to_12.png' });
    await KidsAgeGroup.updateOne({ title: 'Teens', image: '/images/kids_eyeglasses.png' }, { image: '/images/kids_teens_12_to_17.png' });
  }
};

// GET Public Kids Age Groups
export const getPublicKidsAgeGroups = async (req: Request, res: Response) => {
  try {
    await ensureDefaultAgeGroups();
    const items = await KidsAgeGroup.find({ status: 'Active', isDeleted: false }).sort({ displayOrder: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kids age groups' });
  }
};

// GET Admin Kids Age Groups
export const getAdminKidsAgeGroups = async (req: Request, res: Response) => {
  try {
    await ensureDefaultAgeGroups();
    const isDeleted = req.query.isDeleted === 'true';
    const search = req.query.search as string;

    const filter: any = { isDeleted };
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const items = await KidsAgeGroup.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.json({ items, total: items.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kids age groups' });
  }
};

// POST Create Kids Age Group
export const createKidsAgeGroup = async (req: Request, res: Response) => {
  try {
    const item = new KidsAgeGroup(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create kids age group' });
  }
};

// PUT Update Kids Age Group
export const updateKidsAgeGroup = async (req: Request, res: Response) => {
  try {
    const item = await KidsAgeGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Kids age group not found' });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update kids age group' });
  }
};

// DELETE Hard Delete
export const deleteKidsAgeGroup = async (req: Request, res: Response) => {
  try {
    const item = await KidsAgeGroup.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Kids age group not found' });
    res.json({ message: 'Kids age group deleted permanently from database' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete kids age group' });
  }
};

// PUT Restore
export const restoreKidsAgeGroup = async (req: Request, res: Response) => {
  try {
    const item = await KidsAgeGroup.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Kids age group not found' });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to restore kids age group' });
  }
};
