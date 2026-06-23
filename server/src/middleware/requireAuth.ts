import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload, ACCESS_COOKIE_NAME } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

function getToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return (req.cookies && req.cookies[ACCESS_COOKIE_NAME]) || null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = payload;
  next();
}

export { getToken };
