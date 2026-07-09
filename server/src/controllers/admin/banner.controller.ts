import { Request, Response } from 'express';
import { Banner } from '../../models/Banner';
import { getIO } from '../../lib/socket';

export async function getAdminBanners(req: Request, res: Response) {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1 });
    return res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching admin banners:', error);
    return res.status(500).json({ error: 'Failed to fetch banners' });
  }
}

export async function createBanner(req: Request, res: Response) {
  try {
    const { title, subtitle, imageUrl, linkUrl, position, displayOrder, isActive } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const banner = new Banner({
      title,
      subtitle,
      imageUrl,
      linkUrl,
      position: position || 'eyeglasses_landing',
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await banner.save();
    try {
      getIO().emit('banner_changed', { action: 'create', banner });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(201).json(banner);
  } catch (error) {
    console.error('Error creating banner:', error);
    return res.status(500).json({ error: 'Failed to create banner' });
  }
}

export async function updateBanner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, linkUrl, position, displayOrder, isActive } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (imageUrl !== undefined) banner.imageUrl = imageUrl;
    if (linkUrl !== undefined) banner.linkUrl = linkUrl;
    if (position !== undefined) banner.position = position;
    if (displayOrder !== undefined) banner.displayOrder = displayOrder;
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();
    try {
      getIO().emit('banner_changed', { action: 'update', banner });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return res.status(500).json({ error: 'Failed to update banner' });
  }
}

export async function deleteBanner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    try {
      getIO().emit('banner_changed', { action: 'delete', id });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return res.status(500).json({ error: 'Failed to delete banner' });
  }
}
