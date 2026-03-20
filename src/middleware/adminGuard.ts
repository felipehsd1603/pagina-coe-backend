import { Request, Response, NextFunction } from 'express';

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
