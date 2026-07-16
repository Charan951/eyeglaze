import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../../config/mongodb';
import { Coupon } from '../../models/Coupon';
import { AuditLog } from '../../models/AuditLog';
import { CouponUsage } from '../../models/CouponUsage';
import { CouponAnalytics } from '../../models/CouponAnalytics';
import { getIO } from '../../lib/socket';
import { escapeRegExp } from '../../lib/regex';

/**
 * Helper to record Audit Log entries
 */
async function logAudit(req: Request, targetId: mongoose.Types.ObjectId, action: 'create' | 'update' | 'delete' | 'duplicate' | 'import', changes?: Record<string, any>) {
  try {
    const performedBy = new mongoose.Types.ObjectId(req.user?.userId);
    const performedByName = req.user?.role || 'Admin';
    
    await AuditLog.create({
      targetId,
      targetType: 'Coupon',
      action,
      performedBy,
      performedByName,
      changes,
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

export async function getAdminCoupons(req: Request, res: Response) {
  try {
    await connectDB();
    const { search, isActive, couponType, page = 1, limit = 10 } = req.query;
    
    const query: any = { isDeleted: false };
    
    if (search) {
      const escapedSearch = escapeRegExp(String(search));
      query.$or = [
        { code: new RegExp(escapedSearch, 'i') },
        { name: new RegExp(escapedSearch, 'i') },
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (couponType) {
      query.couponType = couponType;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .populate('userSpecific', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    return res.status(200).json({
      coupons,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('get admin coupons error:', error);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
}

export async function createCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const body = req.body;
    
    const existing = await Coupon.findOne({ code: body.code.toUpperCase(), isDeleted: false });
    if (existing) {
      return res.status(400).json({ error: 'A coupon with this code already exists' });
    }
    
    const newCoupon = new Coupon({
      ...body,
      code: body.code.toUpperCase(),
      createdBy: req.user?.userId,
    });
    
    await newCoupon.save();
    await logAudit(req, newCoupon._id as mongoose.Types.ObjectId, 'create', body);
    try {
      getIO().emit('coupon_changed', { action: 'create', coupon: newCoupon });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(201).json({ coupon: newCoupon });
  } catch (error) {
    console.error('create coupon error:', error);
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
}

export async function updateCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const body = req.body;
    
    const coupon = await Coupon.findOne({ _id: id, isDeleted: false });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    if (body.code && body.code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ code: body.code.toUpperCase(), isDeleted: false });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ error: 'A coupon with this code already exists' });
      }
    }
    
    // Track modifications for changes
    const changes: Record<string, any> = {};
    Object.keys(body).forEach((key) => {
      if (JSON.stringify((coupon as any)[key]) !== JSON.stringify(body[key])) {
        changes[key] = { old: (coupon as any)[key], new: body[key] };
        (coupon as any)[key] = body[key];
      }
    });
    
    coupon.updatedBy = new mongoose.Types.ObjectId(req.user?.userId);
    await coupon.save();
    
    if (Object.keys(changes).length > 0) {
      await logAudit(req, coupon._id as mongoose.Types.ObjectId, 'update', changes);
    }
    try {
      getIO().emit('coupon_changed', { action: 'update', coupon });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json({ coupon });
  } catch (error) {
    console.error('update coupon error:', error);
    return res.status(500).json({ error: 'Failed to update coupon' });
  }
}

export async function deleteCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    
    const coupon = await Coupon.findById(id);
    if (!coupon || coupon.isDeleted) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    coupon.isDeleted = true;
    coupon.isActive = false;
    coupon.updatedBy = new mongoose.Types.ObjectId(req.user?.userId);
    await coupon.save();
    
    await logAudit(req, coupon._id as mongoose.Types.ObjectId, 'delete', { code: coupon.code });
    try {
      getIO().emit('coupon_changed', { action: 'delete', id });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json({ message: 'Coupon soft deleted successfully' });
  } catch (error) {
    console.error('delete coupon error:', error);
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
}

export async function duplicateCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    
    const coupon = await Coupon.findOne({ _id: id, isDeleted: false }).lean();
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon to duplicate not found' });
    }
    
    // Generate a unique code
    let newCode = `${coupon.code}_COPY`;
    let suffix = 1;
    while (await Coupon.findOne({ code: newCode, isDeleted: false })) {
      newCode = `${coupon.code}_COPY${suffix}`;
      suffix++;
    }
    
    // Remove ID properties
    const { _id, createdAt, updatedAt, usedCount, ...copyData } = coupon as any;
    
    const duplicated = new Coupon({
      ...copyData,
      code: newCode,
      name: `${coupon.name} (Copy)`,
      usedCount: 0,
      createdBy: req.user?.userId,
    });
    
    await duplicated.save();
    await logAudit(req, duplicated._id as mongoose.Types.ObjectId, 'duplicate', { sourceCode: coupon.code, newCode });
    try {
      getIO().emit('coupon_changed', { action: 'duplicate', coupon: duplicated });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(201).json({ coupon: duplicated });
  } catch (error) {
    console.error('duplicate coupon error:', error);
    return res.status(500).json({ error: 'Failed to duplicate coupon' });
  }
}

export async function bulkImportCoupons(req: Request, res: Response) {
  try {
    await connectDB();
    const { coupons } = req.body;
    
    if (!Array.isArray(coupons) || coupons.length === 0) {
      return res.status(400).json({ error: 'Invalid payload: Array of coupons required' });
    }
    
    const imported: any[] = [];
    const skipped: any[] = [];
    
    for (const item of coupons) {
      try {
        const existing = await Coupon.findOne({ code: item.code.toUpperCase(), isDeleted: false });
        if (existing) {
          skipped.push({ code: item.code, reason: 'Duplicate code' });
          continue;
        }
        
        const coupon = new Coupon({
          ...item,
          code: item.code.toUpperCase(),
          createdBy: req.user?.userId,
        });
        await coupon.save();
        imported.push(coupon);
        await logAudit(req, coupon._id as mongoose.Types.ObjectId, 'import', { code: coupon.code });
      } catch (err: any) {
        skipped.push({ code: item.code, reason: err.message || 'Validation error' });
      }
    }
    
    try {
      getIO().emit('coupon_changed', { action: 'import' });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json({
      message: `Import completed. ${imported.length} imported, ${skipped.length} skipped`,
      imported: imported.map(c => c.code),
      skipped,
    });
  } catch (error) {
    console.error('bulk import error:', error);
    return res.status(500).json({ error: 'Failed to import coupons' });
  }
}

export async function bulkExportCoupons(req: Request, res: Response) {
  try {
    await connectDB();
    const coupons = await Coupon.find({ isDeleted: false }).sort({ createdAt: -1 });
    return res.status(200).json({ coupons });
  } catch (error) {
    console.error('bulk export error:', error);
    return res.status(500).json({ error: 'Failed to export coupons' });
  }
}

export async function getCouponAnalytics(req: Request, res: Response) {
  try {
    await connectDB();
    const { startDate, endDate } = req.query;
    
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(String(startDate));
      if (endDate) filter.date.$lte = new Date(String(endDate));
    }
    
    const stats = await CouponAnalytics.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$couponId',
          code: { $first: '$code' },
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          usages: { $sum: '$usages' },
          revenue: { $sum: '$revenue' },
          discountAmount: { $sum: '$discountAmount' },
          failureCount: { $sum: '$failureCount' },
        },
      },
      { $sort: { usages: -1 } },
    ]);
    
    return res.status(200).json({ stats });
  } catch (error) {
    console.error('get analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

export async function getCouponReports(req: Request, res: Response) {
  try {
    await connectDB();
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const usages = await CouponUsage.find({})
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('couponId', 'code name')
      .populate('userId', 'name email mobile');
      
    const total = await CouponUsage.countDocuments({});
    
    return res.status(200).json({
      usages,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('get reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

export async function getCouponDashboard(req: Request, res: Response) {
  try {
    await connectDB();
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const totalCoupons = await Coupon.countDocuments({ isDeleted: false });
    const activeCoupons = await Coupon.countDocuments({ isActive: true, isDeleted: false });
    const expiredCoupons = await Coupon.countDocuments({
      validTo: { $lt: now },
      isDeleted: false,
    });
    
    // Usages & Revenue today
    const usageToday = await CouponUsage.aggregate([
      { $match: { usedAt: { $gte: startOfToday }, status: 'applied' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          discount: { $sum: '$discountApplied' },
          revenue: { $sum: '$transactionAmount' },
        },
      },
    ]);
    
    // Overall Stats
    const overallStats = await CouponUsage.aggregate([
      { $match: { status: 'applied' } },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: '$discountApplied' },
          totalUsages: { $sum: 1 },
        },
      },
    ]);
    
    // Audit logs
    const auditLogs = await AuditLog.find({ targetType: 'Coupon' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('performedBy', 'name role');
      
    return res.status(200).json({
      counters: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        todayUsages: usageToday[0]?.count || 0,
        todayDiscount: usageToday[0]?.discount || 0,
        todayRevenue: usageToday[0]?.revenue || 0,
        totalDiscountGiven: overallStats[0]?.totalDiscount || 0,
        totalUsagesCount: overallStats[0]?.totalUsages || 0,
      },
      auditLogs,
    });
  } catch (error) {
    console.error('get dashboard data error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }
}
