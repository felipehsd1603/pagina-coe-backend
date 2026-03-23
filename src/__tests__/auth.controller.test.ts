import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock prisma
vi.mock('../config/database', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock env - must match setup values
vi.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
    JWT_EXPIRES_IN: '1h',
    AUTH_MODE: 'mock',
    MOCK_ADMIN_PASSWORD: 'admin123',
    MOCK_EDITOR_PASSWORD: 'editor123',
    MOCK_VIEWER_PASSWORD: 'viewer123',
  },
}));

import { mockLogin, logout, getMe } from '../controllers/auth.controller';
import prisma from '../config/database';
import { tokenBlacklist } from '../middleware/authMiddleware';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const next: NextFunction = vi.fn();

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenBlacklist.destroy();
  });

  describe('mockLogin', () => {
    it('should return 400 when email or password missing', async () => {
      const req = mockReq({ body: { email: 'test@test.com' } });
      const res = mockRes();
      await mockLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email e senha sao obrigatorios' });
    });

    it('should return 401 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const req = mockReq({ body: { email: 'nonexistent@test.com', password: 'pass' } });
      const res = mockRes();
      await mockLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciais invalidas' });
    });

    it('should return 401 when password is wrong', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN',
        entraId: 'e1', createdAt: new Date(),
      });
      const req = mockReq({ body: { email: 'admin@aegea.mock', password: 'wrongpass' } });
      const res = mockRes();
      await mockLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciais invalidas' });
    });

    it('should return token on successful login', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1', email: 'admin@aegea.mock', name: 'Admin CoE', role: 'ADMIN',
        entraId: 'e1', createdAt: new Date(),
      });
      const req = mockReq({ body: { email: 'admin@aegea.mock', password: 'admin123' } });
      const res = mockRes();
      await mockLogin(req, res, next);
      expect(res.json).toHaveBeenCalled();
      const response = vi.mocked(res.json).mock.calls[0][0];
      expect(response).toHaveProperty('token');
      expect(response.user).toEqual({
        id: '1',
        email: 'admin@aegea.mock',
        name: 'Admin CoE',
        role: 'ADMIN',
      });
    });

    it('should generate valid JWT on login', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1', email: 'admin@aegea.mock', name: 'Admin CoE', role: 'ADMIN',
        entraId: 'e1', createdAt: new Date(),
      });
      const req = mockReq({ body: { email: 'admin@aegea.mock', password: 'admin123' } });
      const res = mockRes();
      await mockLogin(req, res, next);
      const { token } = vi.mocked(res.json).mock.calls[0][0];
      const decoded = jwt.verify(token, 'test-secret-key-that-is-at-least-32-chars-long', {
        algorithms: ['HS256'],
        issuer: 'portal-aegea-mock',
      }) as jwt.JwtPayload;
      expect(decoded.email).toBe('admin@aegea.mock');
      expect(decoded.role).toBe('ADMIN');
    });
  });

  describe('logout', () => {
    it('should blacklist token on logout', async () => {
      const token = jwt.sign({ sub: '1', id: '1' }, 'test-secret-key-that-is-at-least-32-chars-long', {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: 'portal-aegea-mock',
      });
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` } as any,
      });
      const res = mockRes();
      await logout(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout realizado com sucesso' });
      expect(tokenBlacklist.has(token)).toBe(true);
    });

    it('should return success even without token', async () => {
      const req = mockReq({ headers: {} as any });
      const res = mockRes();
      await logout(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout realizado com sucesso' });
    });
  });

  describe('getMe', () => {
    it('should return 401 when no user on request', async () => {
      const req = mockReq();
      const res = mockRes();
      await getMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return user data when authenticated', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN',
      } as any);
      const req = mockReq({ user: { id: '1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN' } });
      const res = mockRes();
      await getMe(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        id: '1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN',
      });
    });
  });
});
