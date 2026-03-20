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
    if (env.AUTH_MODE === 'mock') {
      // Mock mode: decode base64 token containing user JSON
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
      next();
    } else {
      // Entra ID mode: verify JWT
      // Placeholder for JWKS validation against Microsoft Entra ID
      const decoded = jwt.verify(token, env.MOCK_JWT_SECRET) as jwt.JwtPayload;
      req.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'USER',
      };
      next();
    }
  } catch (error) {
    res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}
