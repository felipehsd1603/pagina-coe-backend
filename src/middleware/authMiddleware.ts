import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticacao nao fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Both mock and entra modes use signed JWT tokens
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.AUTH_MODE === 'mock' ? 'portal-aegea-mock' : 'portal-aegea',
    }) as jwt.JwtPayload;

    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'VIEWER',
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}
