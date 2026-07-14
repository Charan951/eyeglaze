import { Request, Response } from 'express';
import { LensType } from '../models/LensType';
import { Lens } from '../models/Lens';
import { clearCachePattern } from '../middleware/cache';
import { getIO } from '../lib/socket';

export const getLensTypes = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter: any = {};
    if (category) {
      filter.category = category;
    }
    const lensTypes = await LensType.find(filter).sort({ createdAt: -1 });
    
    // Aggregate lens counts
    const lensCounts = await Lens.aggregate([
      { $group: { _id: '$lensType', count: { $sum: 1 } } }
    ]);
    
    const countMap = new Map(lensCounts.map(item => [item._id.toString(), item.count]));
    
    const result = lensTypes.map(lt => ({
      ...lt.toObject(),
      lensCount: countMap.get(lt._id.toString()) || 0
    }));

    res.json({ lensTypes: result });
  } catch (error) {
    console.error('Error fetching lens types:', error);
    res.status(500).json({ message: 'Failed to fetch lens types' });
  }
};

export const createLensType = async (req: Request, res: Response) => {
  try {
    const { name, status, category = 'eyeglasses' } = req.body;
    const existing = await LensType.findOne({ name, category });
    if (existing) {
      return res.status(400).json({ message: 'Lens Type name must be unique within a category' });
    }
    const newLensType = new LensType({ name, status, category });
    await newLensType.save();
    try {
      getIO().emit('lens_type_changed', { action: 'create', lensType: newLensType });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    await clearCachePattern('cache:/api/products*');
    await clearCachePattern('cache:/api/lens-options*');
    res.status(201).json({ lensType: newLensType });
  } catch (error) {
    console.error('Error creating lens type:', error);
    res.status(500).json({ message: 'Failed to create lens type' });
  }
};

export const updateLensType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, category } = req.body;
    const existing = await LensType.findOne({ name, category, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Lens Type name must be unique within a category' });
    }
    const updated = await LensType.findByIdAndUpdate(id, { name, status, category }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Lens Type not found' });
    try {
      getIO().emit('lens_type_changed', { action: 'update', lensType: updated });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    await clearCachePattern('cache:/api/products*');
    await clearCachePattern('cache:/api/lens-options*');
    res.json({ lensType: updated });
  } catch (error) {
    console.error('Error updating lens type:', error);
    res.status(500).json({ message: 'Failed to update lens type' });
  }
};

export const deleteLensType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lensesCount = await Lens.countDocuments({ lensType: id });
    if (lensesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete a Lens Type if lenses exist.' });
    }
    const deleted = await LensType.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Lens Type not found' });
    try {
      getIO().emit('lens_type_changed', { action: 'delete', id });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    await clearCachePattern('cache:/api/products*');
    await clearCachePattern('cache:/api/lens-options*');
    res.json({ message: 'Lens Type deleted successfully' });
  } catch (error) {
    console.error('Error deleting lens type:', error);
    res.status(500).json({ message: 'Failed to delete lens type' });
  }
};
