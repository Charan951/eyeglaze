import { Request, Response } from 'express';
import { Reel } from '../../models/Reel';
import { getIO } from '../../lib/socket';

export async function getAdminReels(req: Request, res: Response) {
  try {
    const reels = await Reel.find().sort({ displayOrder: 1 });
    return res.status(200).json(reels);
  } catch (error) {
    console.error('Error fetching admin reels:', error);
    return res.status(500).json({ error: 'Failed to fetch reels' });
  }
}

export async function createReel(req: Request, res: Response) {
  try {
    const { title, videoUrl, description, displayOrder, isActive } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and videoUrl are required' });
    }

    const reel = new Reel({
      title,
      videoUrl,
      description,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await reel.save();
    try {
      getIO().emit('reel_changed', { action: 'create', reel });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(201).json(reel);
  } catch (error) {
    console.error('Error creating reel:', error);
    return res.status(500).json({ error: 'Failed to create reel' });
  }
}

export async function updateReel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, videoUrl, description, displayOrder, isActive } = req.body;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (title !== undefined) reel.title = title;
    if (videoUrl !== undefined) reel.videoUrl = videoUrl;
    if (description !== undefined) reel.description = description;
    if (displayOrder !== undefined) reel.displayOrder = displayOrder;
    if (isActive !== undefined) reel.isActive = isActive;

    await reel.save();
    try {
      getIO().emit('reel_changed', { action: 'update', reel });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json(reel);
  } catch (error) {
    console.error('Error updating reel:', error);
    return res.status(500).json({ error: 'Failed to update reel' });
  }
}

export async function deleteReel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const reel = await Reel.findByIdAndDelete(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    try {
      getIO().emit('reel_changed', { action: 'delete', id });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Error deleting reel:', error);
    return res.status(500).json({ error: 'Failed to delete reel' });
  }
}
