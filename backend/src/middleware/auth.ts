import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { unauthorized, forbidden } from '../utils/httpError.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Requires a valid Bearer JWT and attaches req.user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized('Missing or invalid Authorization header'));
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, role: payload.role as Role };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

/**
 * Restricts access to specific roles. Must be used after requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
