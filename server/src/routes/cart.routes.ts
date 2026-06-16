import { Router, Request, Response } from 'express';
import { connectDB } from '../lib/mongodb';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const cart = await Cart.findOne({ user: req.user!.userId }).populate(
      'items.product',
      'name images price sku frame colors'
    );

    if (!cart) {
      return res.status(200).json({ cart: { items: [], total: 0 } });
    }

    return res.status(200).json({ cart });
  } catch (error) {
    console.error('GET cart error:', error);
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const body = req.body || {};
    const { productId, color, qty = 1, lens } = body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      cart = new Cart({ user: req.user!.userId, items: [] });
    }

    // Check for duplicate item
    const existingIdx = cart.items.findIndex(
      (item: any) =>
        item.product.toString() === productId &&
        item.color === color &&
        item.lensType === (lens?.lensType || null)
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].qty += qty;
    } else {
      const newItem = {
        product: productId,
        qty,
        color,
        framePrice: product.price?.selling || 1,
        fittingCharge: lens ? 199 : 0,
        deliveryCharge: 99,
        ...(lens || {}),
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date();
    await cart.save();

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('POST cart error:', error);
    return res.status(500).json({ error: 'Failed to add to cart' });
  }
});

router.put('/:itemId', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { itemId } = req.params;
    const body = req.body || {};
    const { qty } = body;

    const cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    if (qty <= 0) {
      cart.items = cart.items.filter(
        (item: { _id?: { toString(): string } }) => item._id?.toString() !== itemId
      ) as typeof cart.items;
    } else {
      const item = cart.items.find((item: any) => item._id?.toString() === itemId);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      item.qty = qty;
    }

    cart.updatedAt = new Date();
    await cart.save();
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('PUT cart item error:', error);
    return res.status(500).json({ error: 'Failed to update cart item' });
  }
});

router.delete('/:itemId', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(
      (item: { _id?: { toString(): string } }) => item._id?.toString() !== itemId
    ) as typeof cart.items;
    cart.updatedAt = new Date();
    await cart.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('DELETE cart item error:', error);
    return res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

router.post('/apply-coupon', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { code, cartTotal } = req.body || {};

    if (!code) return res.status(200).json({ valid: false, message: 'Coupon code required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(200).json({ valid: false, message: 'Invalid coupon code' });

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return res.status(200).json({ valid: false, message: 'Coupon not yet active' });
    }
    const expiryDate = coupon.validTo || coupon.expiresAt;
    if (expiryDate && expiryDate < now) {
      return res.status(200).json({ valid: false, message: 'Coupon has expired' });
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return res.status(200).json({
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`,
      });
    }

    if (coupon.usageLimitTotal && coupon.usedCount >= coupon.usageLimitTotal) {
      return res.status(200).json({ valid: false, message: 'Coupon usage limit exceeded' });
    }

    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = (cartTotal * coupon.discountValue) / 100;
      const cap = coupon.maxDiscount || coupon.maxDiscountCap;
      if (cap) discount = Math.min(discount, cap);
    } else {
      discount = coupon.discountValue;
    }

    return res.status(200).json({
      valid: true,
      discount: Math.round(discount),
      message: `Coupon applied! You save ₹${Math.round(discount)}`,
    });
  } catch (error) {
    console.error('apply-coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

export default router;
