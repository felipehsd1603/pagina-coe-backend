import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

vi.mock('../config/env', () => ({
  env: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long', AUTH_MODE: 'mock' },
}));

import { authMiddleware, tokenBlacklist } from '../middleware/authMiddleware';
import { adminGuard } from '../middleware/adminGuard';
import { requireRole } from '../middleware/requireRole';
import { auditMiddleware } from '../middleware/auditMiddleware';

const JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';

function createToken(payload: object = {}, options: jwt.SignOptions = {}): string {
  return jwt.sign(
    { sub: '1', id: '1', email: 'test@test.com', name: 'Test', role: 'ADMIN', ...payload },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h', issuer: 'portal-aegea-mock', ...options }
  );
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { headers: {}, user: undefined, method: 'GET', originalUrl: '/test', ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' }, ...overrides } as unknown as Request;
}
function mockRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
}

describe('authMiddleware', () => {
  beforeEach(() => { vi.clearAllMocks(); tokenBlacklist.destroy(); });

  it('should reject without auth header', () => {
    const req = mockReq(); const res = mockRes(); const next = vi.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de autenticacao nao fornecido' });
  });

  it('should reject malformed header', () => {
    const req = mockReq({ headers: { authorization: 'NotBearer x' } as any });
    const res = mockRes(); const next = vi.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should reject blacklisted token', () => {
    const token = createToken();
    tokenBlacklist.add(token, Date.now() + 3600000);
    const req = mockReq({ headers: { authorization: 'Bearer ' + token } as any });
    const res = mockRes(); const next = vi.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token foi invalidado (logout realizado)' });
  });

  it('should reject expired token', () => {
    const token = jwt.sign(
      { sub: '1', id: '1', email: 'test@t.com', name: 'T', role: 'ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '-1h', issuer: 'portal-aegea-mock' }
    );
    const req = mockReq({ headers: { authorization: 'Bearer ' + token } as any });
    const res = mockRes(); const next = vi.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalido ou expirado' });
  });

  it('should accept valid token', () => {
    const token = createToken({ sub: 'u1', id: 'u1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const req = mockReq({ headers: { authorization: 'Bearer ' + token } as any });
    const res = mockRes(); const next = vi.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('admin@aegea.mock');
  });

  it('should reject wrong issuer', () => {
    const token = jwt.sign(
      { sub: '1', id: '1', email: 't@t.com', name: 'T', role: 'ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h', issuer: 'wrong' }
    );
    const req = mockReq({ headers: { authorization: 'Bearer ' + token } as any });
    const res = mockRes(); const next = vi.fn();
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('adminGuard', () => {
  it('reject non-admin', () => {
    const req = mockReq({ user: { id: '1', email: 'e@e.com', name: 'E', role: 'EDITOR' } });
    const res = mockRes(); const next = vi.fn();
    adminGuard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it('reject unauthenticated', () => {
    const req = mockReq(); const res = mockRes(); const next = vi.fn();
    adminGuard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it('allow ADMIN', () => {
    const req = mockReq({ user: { id: '1', email: 'a@a.com', name: 'A', role: 'ADMIN' } });
    const res = mockRes(); const next = vi.fn();
    adminGuard(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  it('401 for unauthenticated', () => {
    const mw = requireRole('EDITOR'); const req = mockReq(); const res = mockRes(); const next = vi.fn();
    mw(req, res, next); expect(res.status).toHaveBeenCalledWith(401);
  });
  it('allow ADMIN when EDITOR required', () => {
    const mw = requireRole('EDITOR');
    const req = mockReq({ user: { id: '1', email: 'a@a.com', name: 'A', role: 'ADMIN' } });
    const res = mockRes(); const next = vi.fn();
    mw(req, res, next); expect(next).toHaveBeenCalled();
  });
  it('reject VIEWER when EDITOR required', () => {
    const mw = requireRole('EDITOR');
    const req = mockReq({ user: { id: '1', email: 'v@v.com', name: 'V', role: 'VIEWER' } });
    const res = mockRes(); const next = vi.fn();
    mw(req, res, next); expect(res.status).toHaveBeenCalledWith(403);
  });
  it('allow EDITOR when EDITOR required', () => {
    const mw = requireRole('EDITOR');
    const req = mockReq({ user: { id: '1', email: 'e@e.com', name: 'E', role: 'EDITOR' } });
    const res = mockRes(); const next = vi.fn();
    mw(req, res, next); expect(next).toHaveBeenCalled();
  });
  it('reject EDITOR when ADMIN required', () => {
    const mw = requireRole('ADMIN');
    const req = mockReq({ user: { id: '1', email: 'e@e.com', name: 'E', role: 'EDITOR' } });
    const res = mockRes(); const next = vi.fn();
    mw(req, res, next); expect(res.status).toHaveBeenCalledWith(403);
  });
  it('allow VIEWER when VIEWER required', () => {
    const mw = requireRole('VIEWER');
    const req = mockReq({ user: { id: '1', email: 'v@v.com', name: 'V', role: 'VIEWER' } });
    const res = mockRes(); const next = vi.fn();
    mw(req, res, next); expect(next).toHaveBeenCalled();
  });
});

describe('auditMiddleware', () => {
  it('log POST', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const req = mockReq({ method: 'POST', originalUrl: '/api/v1/admin/apps', user: { id: '1', email: 'a@a.com', name: 'A', role: 'ADMIN' } });
    const res = mockRes(); const next = vi.fn();
    auditMiddleware(req, res, next);
    expect(spy).toHaveBeenCalled(); expect(next).toHaveBeenCalled(); spy.mockRestore();
  });
  it('skip GET', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const req = mockReq({ method: 'GET' }); const res = mockRes(); const next = vi.fn();
    auditMiddleware(req, res, next);
    expect(spy).not.toHaveBeenCalled(); expect(next).toHaveBeenCalled(); spy.mockRestore();
  });
});
