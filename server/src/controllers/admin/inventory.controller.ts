import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Product } from '../../models/Product';

export async function getInventory(req: Request, res: Response) {
  try {
    await connectDB();
    const lowStockOnly = req.query.lowStock === 'true';

    const products = await Product.find({ isActive: true }).select('sku name colors isBestseller');

    const inventory = products.map((p) => ({
      id: p._id,
      sku: p.sku,
      name: p.name,
      isBestseller: p.isBestseller,
      colors: p.colors.map((c: any) => ({
        name: c.name,
        stock: c.stock,
        isLowStock: c.stock < 10,
      })),
      totalStock: p.colors.reduce((sum: number, c: any) => sum + (c.stock || 0), 0),
      hasLowStock: p.colors.some((c: any) => c.stock < 10),
    }));

    const filtered = lowStockOnly ? inventory.filter((p) => p.hasLowStock) : inventory;

    return res.status(200).json({ inventory: filtered });
  } catch (error) {
    console.error('GET inventory error:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
}
