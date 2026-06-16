import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

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

import adminProductsRoutes from './routes/admin/products.routes';
import adminInventoryRoutes from './routes/admin/inventory.routes';
import adminUsersRoutes from './routes/admin/users.routes';
import adminOrdersRoutes from './routes/admin/orders.routes';
import adminStatsRoutes from './routes/admin/stats.routes';

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

// Admin routes
const adminRouter = express.Router();
adminRouter.use('/products', adminProductsRoutes);
adminRouter.use('/inventory', adminInventoryRoutes);
adminRouter.use('/users', adminUsersRoutes);
adminRouter.use('/orders', adminOrdersRoutes);
adminRouter.use('/stats', adminStatsRoutes);

app.use('/api/admin', requireAdmin(), adminRouter);

export default app;
