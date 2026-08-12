import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { clearCachePattern } from '../middleware/cache';

export async function recalcProductRating(productId: mongoose.Types.ObjectId | string) {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, {
    rating: Number(avgRating.toFixed(1)),
    reviewCount: count,
  });

  // The product detail/list endpoints are cached; without this, a new/removed
  // review wouldn't be visible until the cache TTL expires.
  await clearCachePattern('cache:/api/products*');
}

// Logged-in users only (enforced by requireAuth on the route).
export async function createReview(req: Request, res: Response) {
  try {
    await connectDB();
    const productId = req.params.productId as string;
    const { rating, title, comment } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (!title || !comment) {
      return res.status(400).json({ error: 'Title and comment are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = await Review.findOne({ product: productId, user: req.user!.userId });
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user!.userId,
      rating: ratingNum,
      title,
      comment,
      isVerifiedPurchase: false,
    });

    await recalcProductRating(productId);

    const populated = await review.populate('user', 'name');

    return res.status(201).json({ review: populated });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this product' });
    }
    console.error('createReview error:', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
}
