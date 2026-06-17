import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/mongodb';
import { Product } from './models/Product';

import { requireAuth } from './middleware/requireAuth';
import { requireAdmin } from './middleware/requireAdmin';

import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import lensOptionsRoutes from './routes/lensOptions.routes';
import usersRoutes from './routes/users.routes';
import cartRoutes from './routes/cart.routes';
import ordersRoutes from './routes/orders.routes';
import prescriptionsRoutes from './routes/prescriptions.routes';
import couponsRoutes from './routes/coupons.routes';
import wishlistRoutes from './routes/wishlist.routes';

import adminProductsRoutes from './routes/admin/products.routes';
import adminInventoryRoutes from './routes/admin/inventory.routes';
import adminUsersRoutes from './routes/admin/users.routes';
import adminOrdersRoutes from './routes/admin/orders.routes';
import adminStatsRoutes from './routes/admin/stats.routes';
import adminUploadRoutes from './routes/admin/upload.routes';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Serve local upload storage in dev/test environment
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Dynamic Sitemap endpoint for Search Engines
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).select('_id updatedAt').lean();
    const clientUrl = process.env.CLIENT_URL || 'https://eyeglaze.com';
    const lastmod = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static URLs
    const staticUrls = [
      { loc: '', changefreq: 'daily', priority: '1.0' },
      { loc: '/products', changefreq: 'daily', priority: '0.9' },
      { loc: '/categories', changefreq: 'weekly', priority: '0.8' },
      { loc: '/offers', changefreq: 'weekly', priority: '0.8' },
      { loc: '/about', changefreq: 'monthly', priority: '0.7' },
      { loc: '/blogs', changefreq: 'weekly', priority: '0.7' },
      { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
    ];

    for (const url of staticUrls) {
      xml += `  <url>\n`;
      xml += `    <loc>${clientUrl}${url.loc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Product URLs
    for (const prod of products) {
      const prodDate = prod.updatedAt ? new Date((prod as any).updatedAt).toISOString().split('T')[0] : lastmod;
      xml += `  <url>\n`;
      xml += `    <loc>${clientUrl}/products/${prod._id}</loc>\n`;
      xml += `    <lastmod>${prodDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    next(error);
  }
});

// Public / mixed-auth routes (in-handler gating where needed)
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/lens-options', lensOptionsRoutes);
app.use('/api/users', usersRoutes);

// Auth-required routes
app.use('/api/cart', requireAuth, cartRoutes);
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/prescriptions', requireAuth, prescriptionsRoutes);
app.use('/api/coupons', requireAuth, couponsRoutes);
app.use('/api/wishlist', requireAuth, wishlistRoutes);

// Admin routes
const adminRouter = express.Router();
adminRouter.use('/products', adminProductsRoutes);
adminRouter.use('/inventory', adminInventoryRoutes);
adminRouter.use('/users', adminUsersRoutes);
adminRouter.use('/orders', adminOrdersRoutes);
adminRouter.use('/stats', adminStatsRoutes);
adminRouter.use('/upload', adminUploadRoutes);

app.use('/api/admin', requireAdmin(), adminRouter);

export default app;
