import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Extend Express Request to include admin field
declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.token as string | undefined;

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const payload = jwt.verify(token, config.JWT_SECRET) as AdminPayload;
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const roleHierarchy: Record<string, number> = { admin: 1, superadmin: 2 };
    const requiredLevel = roleHierarchy[role] ?? 1;
    const adminLevel = roleHierarchy[req.admin.role] ?? 0;

    if (adminLevel < requiredLevel) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
