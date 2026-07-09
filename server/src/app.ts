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
import ticketsRoutes from './routes/tickets.routes';
import cashbackCampaignsRoutes from './routes/cashbackCampaigns.routes';
import categoriesRoutes from './routes/categories.routes';

import adminProductsRoutes from './routes/admin/products.routes';
import adminInventoryRoutes from './routes/admin/inventory.routes';
import adminUsersRoutes from './routes/admin/users.routes';
import adminOrdersRoutes from './routes/admin/orders.routes';
import adminStatsRoutes from './routes/admin/stats.routes';
import adminUploadRoutes from './routes/admin/upload.routes';
import adminTicketsRoutes from './routes/admin/tickets.routes';
import adminCategoriesRoutes from './routes/admin/categories.routes';
import homepageVideosRoutes from './routes/homepageVideos.routes';
import adminHomepageVideosRoutes from './routes/admin/homepageVideos.routes';
import bannersRoutes from './routes/banners.routes';
import adminBannersRoutes from './routes/admin/banners.routes';
import adminLensTypesRoutes from './routes/admin/lensTypes.routes';
import adminLensesRoutes from './routes/admin/lenses.routes';
import adminCouponsRoutes from './routes/admin/coupons.routes';
import reelsRoutes from './routes/reels.routes';
import adminReelsRoutes from './routes/admin/reels.routes';

dotenv.config();

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'https://web.eyeglaze.in'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in client url list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow localhost and 127.0.0.1 with any port
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) {
        return callback(null, true);
      }

      // Allow mobile emulator loopback
      const isEmulator = /^http:\/\/10\.0\.2\.2(:\d+)?$/.test(origin);
      if (isEmulator) {
        return callback(null, true);
      }

      // Allow all origins in development mode
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Otherwise reject
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Serve local upload storage in dev/test environment
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

// Dynamic Sitemap endpoint for Search Engines
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).select('_id updatedAt').lean();
    const allowedOrigins = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
      : ['http://localhost:5173', 'https://web.eyeglaze.in'];
    const clientUrl = allowedOrigins.find((url) => url !== '*') || 'https://web.eyeglaze.in';
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
app.use('/api/homepage-videos', homepageVideosRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/cashback-campaigns', cashbackCampaignsRoutes);
app.use('/api/categories', categoriesRoutes);

// Auth-required routes
app.use('/api/cart', requireAuth, cartRoutes);
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/prescriptions', requireAuth, prescriptionsRoutes);
app.use('/api/coupons', requireAuth, couponsRoutes);
app.use('/api/wishlist', requireAuth, wishlistRoutes);
app.use('/api/tickets', requireAuth, ticketsRoutes);

// Admin routes
const adminRouter = express.Router();
adminRouter.use('/products', adminProductsRoutes);
adminRouter.use('/inventory', adminInventoryRoutes);
adminRouter.use('/users', adminUsersRoutes);
adminRouter.use('/orders', adminOrdersRoutes);
adminRouter.use('/stats', adminStatsRoutes);
adminRouter.use('/upload', adminUploadRoutes);
adminRouter.use('/tickets', adminTicketsRoutes);
adminRouter.use('/categories', adminCategoriesRoutes);
adminRouter.use('/homepage-videos', adminHomepageVideosRoutes);
adminRouter.use('/banners', adminBannersRoutes);
adminRouter.use('/reels', adminReelsRoutes);
adminRouter.use('/lens-types', adminLensTypesRoutes);
adminRouter.use('/lenses', adminLensesRoutes);
adminRouter.use('/coupons', adminCouponsRoutes);

app.use('/api/admin', requireAdmin(), adminRouter);

export default app;
