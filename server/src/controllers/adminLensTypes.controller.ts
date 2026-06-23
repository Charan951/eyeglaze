import { Request, Response } from 'express';
import { LensType } from '../models/LensType';
import { Lens } from '../models/Lens';

export const getLensTypes = async (req: Request, res: Response) => {
  try {
    const lensTypes = await LensType.find().sort({ createdAt: -1 });
    
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
    const { name, status } = req.body;
    const existing = await LensType.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Lens Type name must be unique' });
    }
    const newLensType = new LensType({ name, status });
    await newLensType.save();
    res.status(201).json({ lensType: newLensType });
  } catch (error) {
    console.error('Error creating lens type:', error);
    res.status(500).json({ message: 'Failed to create lens type' });
  }
};

export const updateLensType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const existing = await LensType.findOne({ name, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Lens Type name must be unique' });
    }
    const updated = await LensType.findByIdAndUpdate(id, { name, status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Lens Type not found' });
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
    res.json({ message: 'Lens Type deleted successfully' });
  } catch (error) {
    console.error('Error deleting lens type:', error);
    res.status(500).json({ message: 'Failed to delete lens type' });
  }
};
