import { Request, Response, NextFunction } from 'express';

type Role = 'VIEWER' | 'EDITOR' | 'ADMIN';

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

/**
 * Middleware that requires the user to have at least one of the specified roles.
 * Supports hierarchy: ADMIN > EDITOR > VIEWER
 *
 * Usage:
 *   requireRole('EDITOR')        — EDITOR and ADMIN can access
 *   requireRole('ADMIN')         — only ADMIN
 *   requireRole('VIEWER')        — any authenticated user with a valid role
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Autenticacao necessaria' });
      return;
    }

    const userRole = req.user.role as Role;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;

    // Check if user's role level meets the minimum required
    const minRequired = Math.min(...roles.map((r) => ROLE_HIERARCHY[r] || 99));

    if (userLevel >= minRequired) {
      next();
      return;
    }

    res.status(403).json({
      error: 'Permissao insuficiente',
      required: roles,
      current: userRole,
    });
  };
}
