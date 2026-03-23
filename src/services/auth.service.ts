import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { tokenBlacklist } from '../middleware/authMiddleware';

/**
 * Obfuscate email for logging (ex: a***@aegea.com.br)
 * SECURITY: Prevents PII leakage in log files
 */
function obfuscateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.charAt(0);
  return `${visible}***@${domain}`;
}

/**
 * Get mock passwords from environment variables.
 * SECURITY: Credentials are never hardcoded — they come from .env
 */
function getMockPasswords(): Record<string, string> {
  const passwords: Record<string, string> = {};
  if (env.MOCK_ADMIN_PASSWORD) passwords['admin@aegea.mock'] = env.MOCK_ADMIN_PASSWORD;
  if (env.MOCK_EDITOR_PASSWORD) passwords['editor@aegea.mock'] = env.MOCK_EDITOR_PASSWORD;
  if (env.MOCK_VIEWER_PASSWORD) passwords['viewer@aegea.mock'] = env.MOCK_VIEWER_PASSWORD;
  return passwords;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Validates credentials and returns a signed JWT token with user data.
 * Throws an error string if validation fails.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthError('Credenciais invalidas', 401);
  }

  // In mock mode, validate against environment-sourced passwords
  if (env.AUTH_MODE === 'mock') {
    const mockPasswords = getMockPasswords();
    const expectedPassword = mockPasswords[email];
    if (!expectedPassword || password !== expectedPassword) {
      console.warn(`[auth] Login falhou para ${obfuscateEmail(email)} - senha incorreta`);
      throw new AuthError('Credenciais invalidas', 401);
    }
  }

  // Sign a proper JWT with expiration
  const token = jwt.sign(
    {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN as unknown as number,
      issuer: env.AUTH_MODE === 'mock' ? 'portal-aegea-mock' : 'portal-aegea',
    }
  );

  console.log(`[auth] Login bem-sucedido: ${obfuscateEmail(user.email)} (role: ${user.role})`);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

/**
 * Invalidates the given JWT token by adding it to the blacklist.
 */
export function invalidateToken(authHeader: string | undefined): void {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 8 * 60 * 60 * 1000;
    tokenBlacklist.add(token, expiresAt);
  }
}

/**
 * Returns the authenticated user's profile.
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    throw new AuthError('Usuario nao encontrado', 404);
  }

  return user;
}

/**
 * Custom error class for auth operations with HTTP status code.
 */
export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AuthError';
  }
}
