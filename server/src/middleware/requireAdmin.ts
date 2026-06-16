import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './requireAuth';

const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];

export function requireAdmin(allowedRoles: string[] = ADMIN_ROLES) {
  return function (req: Request, res: Response, next: NextFunction) {
    requireAuth(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      next();
    });
  };
}

export { ADMIN_ROLES };
