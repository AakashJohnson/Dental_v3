import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { db } from '../store/db.js';
import { Role } from '../domain/enums.js';
import { hasPermission, Permission } from '../domain/permissions.js';
import { User } from '../types/index.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }
  try {
    const payload = authService.verify(header.slice(7));
    const user = db.users.get(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Require the user to hold at least one of the given roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Requires role: ${roles.join(' | ')}` });
      return;
    }
    next();
  };
}

/** Require a capability from the permission map (04_Roles_RACI_Permissions). */
export function requirePermission(perm: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (!hasPermission(req.user.role, perm)) {
      res.status(403).json({ error: `Missing permission: ${perm}` });
      return;
    }
    next();
  };
}
