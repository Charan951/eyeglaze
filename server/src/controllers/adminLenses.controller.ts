import { Request, Response } from 'express';
import { Lens } from '../models/Lens';
import { LensType } from '../models/LensType';

export const getLenses = async (req: Request, res: Response) => {
  try {
    const { typeId } = req.query;
    const filter: any = {};
    if (typeId) {
      filter.lensType = typeId;
    }
    const lenses = await Lens.find(filter).populate('lensType').sort({ createdAt: -1 });
    res.json({ lenses });
  } catch (error) {
    console.error('Error fetching lenses:', error);
    res.status(500).json({ message: 'Failed to fetch lenses' });
  }
};

export const createLens = async (req: Request, res: Response) => {
  try {
    const { name, lensType, basePrice, status } = req.body;
    
    if (basePrice < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const typeExists = await LensType.findById(lensType);
    if (!typeExists) {
      return res.status(400).json({ message: 'Invalid Lens Type' });
    }

    const existing = await Lens.findOne({ name, lensType });
    if (existing) {
      return res.status(400).json({ message: 'Lens name must be unique within a Lens Type' });
    }

    const newLens = new Lens({ name, lensType, basePrice, status });
    await newLens.save();
    
    const populatedLens = await Lens.findById(newLens._id).populate('lensType');
    res.status(201).json({ lens: populatedLens });
  } catch (error) {
    console.error('Error creating lens:', error);
    res.status(500).json({ message: 'Failed to create lens' });
  }
};

export const updateLens = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, lensType, basePrice, status } = req.body;

    if (basePrice < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const typeExists = await LensType.findById(lensType);
    if (!typeExists) {
      return res.status(400).json({ message: 'Invalid Lens Type' });
    }

    const existing = await Lens.findOne({ name, lensType, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Lens name must be unique within a Lens Type' });
    }

    const updated = await Lens.findByIdAndUpdate(
      id,
      { name, lensType, basePrice, status },
      { new: true }
    ).populate('lensType');

    if (!updated) return res.status(404).json({ message: 'Lens not found' });
    res.json({ lens: updated });
  } catch (error) {
    console.error('Error updating lens:', error);
    res.status(500).json({ message: 'Failed to update lens' });
  }
};

export const deleteLens = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Lens.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Lens not found' });
    res.json({ message: 'Lens deleted successfully' });
  } catch (error) {
    console.error('Error deleting lens:', error);
    res.status(500).json({ message: 'Failed to delete lens' });
  }
};
