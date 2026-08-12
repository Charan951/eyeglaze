import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Review } from '../../models/Review';
import { recalcProductRating } from '../reviews.controller';

export async function adminGetAllReviews(req: Request, res: Response) {
  try {
    await connectDB();
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const skip = (page - 1) * limit;
    const productId = req.query.productId as string | undefined;
    const rating = req.query.rating as string | undefined;

    const query: Record<string, any> = {};
    if (productId) query.product = productId;
    if (rating) query.rating = Number(rating);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email')
        .populate('product', 'name sku images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    return res.status(200).json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('adminGetAllReviews error:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

export async function adminDeleteReview(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalcProductRating(productId);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('adminDeleteReview error:', error);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
}
