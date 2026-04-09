import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { redis, isRedisAvailable } from '../config/redis';
import { logger } from '../config/logger';
import prisma from '../config/database';

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

// ─── Blacklist key prefix ──────────────────────────────
const BLACKLIST_PREFIX = 'token:blacklist:';

/**
 * Derive a stable key for a token.
 * Uses `jti` claim if present, otherwise SHA-256 hash of the token.
 */
function tokenKey(token: string): string {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    if (decoded?.jti) return decoded.jti;
  } catch {
    // decode failed — fall through to hash
  }
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Token blacklist backed by Redis (multi-pod safe).
 * Falls back to in-memory Map when Redis is unavailable.
 */
class TokenBlacklist {
  private fallback = new Map<string, number>(); // token key -> expiresAt (ms)
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Cleanup expired fallback tokens every 15 minutes
    this.cleanupInterval = setInterval(() => this.cleanupFallback(), 15 * 60 * 1000);
  }

  /**
   * Add a token to the blacklist.
   * @param token  Raw JWT string
   * @param expiresAt  Expiry timestamp in milliseconds
   */
  async add(token: string, expiresAt: number): Promise<void> {
    const key = BLACKLIST_PREFIX + tokenKey(token);
    const ttlSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));

    if (isRedisAvailable()) {
      try {
        await redis.set(key, '1', 'EX', ttlSeconds);
        return;
      } catch (err) {
        logger.warn({ err }, 'Redis SET failed for token blacklist, falling back to in-memory');
      }
    }

    // In-memory fallback
    this.fallback.set(tokenKey(token), expiresAt);
  }

  /**
   * Check if a token is blacklisted.
   */
  async has(token: string): Promise<boolean> {
    const tKey = tokenKey(token);
    const redisKey = BLACKLIST_PREFIX + tKey;

    if (isRedisAvailable()) {
      try {
        const exists = await redis.exists(redisKey);
        return exists === 1;
      } catch (err) {
        logger.warn({ err }, 'Redis EXISTS failed for token blacklist, checking in-memory fallback');
      }
    }

    // In-memory fallback
    const expiresAt = this.fallback.get(tKey);
    if (expiresAt === undefined) return false;
    if (expiresAt <= Date.now()) {
      this.fallback.delete(tKey);
      return false;
    }
    return true;
  }

  private cleanupFallback(): void {
    const now = Date.now();
    for (const [key, expiresAt] of this.fallback) {
      if (expiresAt <= now) {
        this.fallback.delete(key);
      }
    }
  }

  /** For graceful shutdown */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.fallback.clear();
  }
}

export const tokenBlacklist = new TokenBlacklist();

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticacao nao fornecido' });
      return;
    }

    const token = authHeader.split(' ')[1] ?? '';

    // SECURITY: Check if token has been invalidated via logout
    if (await tokenBlacklist.has(token)) {
      res.status(401).json({ error: 'Token foi invalidado (logout realizado)' });
      return;
    }

    // Both mock and entra modes use signed JWT tokens
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.AUTH_MODE === 'mock' ? 'portal-aegea-mock' : 'portal-aegea',
    }) as jwt.JwtPayload;

    const userId = decoded.sub || decoded.id;

    req.user = {
      id: userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'VIEWER',
    };

    // SECURITY: Fail-closed check — if DB is unavailable, deny access (503)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (dbUser && !dbUser.isActive) {
      res.status(403).json({ error: 'Conta desativada' });
      return;
    }

    next();
  } catch (err) {
    // Distinguish JWT errors from DB errors
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token invalido ou expirado' });
    } else {
      logger.error({ err }, 'authMiddleware service error');
      res.status(503).json({ error: 'Service temporarily unavailable' });
    }
  }
}

/**
 * Optional auth middleware — populates req.user if a valid token is present,
 * but does NOT reject the request if no token is provided.
 * LGPD: Used on public endpoints to conditionally strip PII.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1] ?? '';
  if (await tokenBlacklist.has(token)) {
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
