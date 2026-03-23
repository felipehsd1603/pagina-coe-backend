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

/**
 * In-memory token blacklist with TTL-based cleanup.
 * SECURITY: Enables JWT invalidation on logout.
 * NOTE: In a multi-instance deployment, replace with Redis.
 */
class TokenBlacklist {
  private tokens = new Map<string, number>(); // token -> expiresAt (ms)
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Cleanup expired tokens every 15 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  add(token: string, expiresAt: number): void {
    this.tokens.set(token, expiresAt);
  }

  has(token: string): boolean {
    return this.tokens.has(token);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.tokens) {
      if (expiresAt <= now) {
        this.tokens.delete(token);
      }
    }
  }

  /** For testing / graceful shutdown */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.tokens.clear();
  }
}

export const tokenBlacklist = new TokenBlacklist();

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticacao nao fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // SECURITY: Check if token has been invalidated via logout
  if (tokenBlacklist.has(token)) {
    res.status(401).json({ error: 'Token foi invalidado (logout realizado)' });
    return;
  }

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

/**
 * Optional auth middleware — populates req.user if a valid token is present,
 * but does NOT reject the request if no token is provided.
 * LGPD: Used on public endpoints to conditionally strip PII.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1];
  if (tokenBlacklist.has(token)) {
    next();
    return;
  }
  try {
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
  } catch {
    // Token invalid — treat as unauthenticated, do not block
  }
  next();
}
