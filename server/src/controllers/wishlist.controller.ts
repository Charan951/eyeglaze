import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Product } from '../models/Product';

export async function getWishlist(req: Request, res: Response) {
  try {
    await connectDB();
    const user = await User.findById(req.user!.userId).populate({
      path: 'wishlist',
      select: 'name images price sku frame colors rating reviewCount isBestseller'
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ wishlist: user.wishlist || [] });
  } catch (error) {
    console.error('GET wishlist error:', error);
    return res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
}

export async function toggleWishlist(req: Request, res: Response) {
  try {
    await connectDB();
    const { productId } = req.body || {};

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wishlistIds = user.wishlist.map((id: any) => id.toString());
    const existsIdx = wishlistIds.indexOf(productId);

    if (existsIdx >= 0) {
      // Remove from wishlist
      user.wishlist.splice(existsIdx, 1);
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      wishlist: user.wishlist,
      added: existsIdx < 0
    });
  } catch (error) {
    console.error('POST wishlist toggle error:', error);
    return res.status(500).json({ error: 'Failed to toggle wishlist' });
  }
}
