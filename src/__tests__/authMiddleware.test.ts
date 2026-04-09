import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock prisma antes de importar o middleware
const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock('../config/database', () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock('../config/redis', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    exists: vi.fn().mockResolvedValue(0),
    quit: vi.fn().mockResolvedValue('OK'),
  },
  isRedisAvailable: vi.fn().mockReturnValue(false),
  connectRedis: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
    AUTH_MODE: 'mock',
  },
}));

import { authMiddleware, optionalAuth, tokenBlacklist } from '../middleware/authMiddleware';
import { logger } from '../config/logger';

const JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';

function makeToken(payload: object = {}, options: jwt.SignOptions = {}): string {
  return jwt.sign(
    { sub: 'u1', id: 'u1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN', ...payload },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h', issuer: 'portal-aegea-mock', ...options }
  );
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    user: undefined,
    method: 'GET',
    originalUrl: '/test',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

// ─────────────────────────────────────────────────────────────
// authMiddleware — testes unitarios
// ─────────────────────────────────────────────────────────────
describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenBlacklist.destroy();
    // Padrao: usuario existe e esta ativo
    mockFindUnique.mockResolvedValue({ isActive: true });
  });

  // ── Casos de header ausente / malformado ────────────────────

  it('deve retornar 401 quando o header Authorization esta ausente', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de autenticacao nao fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o header existe mas nao tem o prefixo "Bearer "', async () => {
    const req = mockReq({ headers: { authorization: 'Basic dXNlcjpwYXNz' } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token de autenticacao nao fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o header e apenas "Bearer" sem espaco nem token', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer' } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Token invalido / expirado ───────────────────────────────

  it('deve retornar 401 quando o token tem assinatura invalida (wrong secret)', async () => {
    const token = jwt.sign(
      { sub: 'u1', id: 'u1', email: 'x@x.com', name: 'X', role: 'ADMIN' },
      'completely-different-secret-that-is-at-least-32c',
      { algorithm: 'HS256', expiresIn: '1h', issuer: 'portal-aegea-mock' }
    );
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o token esta expirado', async () => {
    const token = jwt.sign(
      { sub: 'u1', id: 'u1', email: 'x@x.com', name: 'X', role: 'ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '-1h', issuer: 'portal-aegea-mock' }
    );
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o issuer esta errado', async () => {
    const token = jwt.sign(
      { sub: 'u1', id: 'u1', email: 'x@x.com', name: 'X', role: 'ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h', issuer: 'issuer-errado' }
    );
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o token e uma string randomica (nao e JWT)', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer nao-sou-um-jwt-valido' } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Blacklist ───────────────────────────────────────────────

  it('deve retornar 401 quando o token esta na blacklist (apos logout)', async () => {
    const token = makeToken();
    await tokenBlacklist.add(token, Date.now() + 3_600_000);

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token foi invalidado (logout realizado)' });
    expect(next).not.toHaveBeenCalled();
    // nao deve consultar o banco apos checar a blacklist
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('nao deve bloquear token diferente que nunca foi adicionado a blacklist', async () => {
    const tokenA = makeToken({ sub: 'u-a', id: 'u-a' });
    const tokenB = makeToken({ sub: 'u-b', id: 'u-b' });
    await tokenBlacklist.add(tokenA, Date.now() + 3_600_000);

    const req = mockReq({ headers: { authorization: `Bearer ${tokenB}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalled();
  });

  // ── Conta desativada ────────────────────────────────────────

  it('deve retornar 403 quando o usuario esta inativo (isActive: false)', async () => {
    mockFindUnique.mockResolvedValueOnce({ isActive: false });
    const token = makeToken();

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conta desativada' });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Usuario nao encontrado no banco ────────────────────────

  it('deve chamar next() quando o usuario nao existe no banco (dbUser null) — token JWT valido basta', async () => {
    // Comportamento atual: se dbUser e null, nao bloqueia (sem registro = deixa passar)
    mockFindUnique.mockResolvedValueOnce(null);
    const token = makeToken();

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // ── Fail-closed: erro de banco retorna 503 ──────────────────

  it('deve retornar 503 quando o banco de dados lanca um erro (fail-closed)', async () => {
    mockFindUnique.mockRejectedValueOnce(new Error('Connection timeout'));
    const token = makeToken();

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();


    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'Service temporarily unavailable' });
    expect(next).not.toHaveBeenCalled();


  });

  it('deve logar o erro de banco no logger.error antes de retornar 503', async () => {
    const dbError = new Error('DB unreachable');
    mockFindUnique.mockRejectedValueOnce(dbError);
    const token = makeToken();

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();


    await authMiddleware(req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: dbError }),
      'authMiddleware service error'
    );


  });

  // ── Token valido ────────────────────────────────────────────

  it('deve chamar next() e popular req.user para token valido com usuario ativo', async () => {
    const token = makeToken({
      sub: 'u-admin',
      id: 'u-admin',
      email: 'admin@aegea.mock',
      name: 'Admin CoE',
      role: 'ADMIN',
    });

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('admin@aegea.mock');
    expect(req.user!.name).toBe('Admin CoE');
    expect(req.user!.role).toBe('ADMIN');
    expect(req.user!.id).toBe('u-admin');
  });

  it('deve usar o campo "sub" como id do usuario quando disponivel', async () => {
    const token = jwt.sign(
      { sub: 'sub-id-prioritario', email: 'x@x.com', name: 'X', role: 'VIEWER' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h', issuer: 'portal-aegea-mock' }
    );

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.id).toBe('sub-id-prioritario');
  });

  it('deve usar "VIEWER" como role padrao quando o token nao tem campo role', async () => {
    const token = jwt.sign(
      { sub: 'u1', id: 'u1', email: 'x@x.com', name: 'X' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h', issuer: 'portal-aegea-mock' }
    );

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.role).toBe('VIEWER');
  });
});

// ─────────────────────────────────────────────────────────────
// optionalAuth — middleware publico que nao bloqueia
// ─────────────────────────────────────────────────────────────
describe('optionalAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenBlacklist.destroy();
  });

  it('deve chamar next() sem popular req.user quando nao ha header Authorization', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('deve chamar next() sem popular req.user quando o token e invalido', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer token-invalido' } as any });
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('deve chamar next() sem popular req.user quando o token esta na blacklist', async () => {
    const token = makeToken();
    await tokenBlacklist.add(token, Date.now() + 3_600_000);

    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('deve popular req.user e chamar next() quando o token e valido', async () => {
    const token = makeToken({ sub: 'u-viewer', id: 'u-viewer', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('v@aegea.mock');
    expect(req.user!.role).toBe('VIEWER');
  });

  it('nunca deve retornar status de erro — sempre deixa a requisicao passar', async () => {
    // Token expirado — deve silenciosamente ignorar
    const token = jwt.sign(
      { sub: 'u1', id: 'u1', email: 'x@x.com', name: 'X', role: 'ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '-1h', issuer: 'portal-aegea-mock' }
    );
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } as any });
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// TokenBlacklist — comportamentos internos
// ─────────────────────────────────────────────────────────────
describe('TokenBlacklist', () => {
  beforeEach(() => {
    tokenBlacklist.destroy();
  });

  it('has() retorna false para token nunca adicionado', async () => {
    expect(await tokenBlacklist.has('qualquer-token')).toBe(false);
  });

  it('has() retorna true para token adicionado com TTL futuro', async () => {
    await tokenBlacklist.add('meu-token', Date.now() + 60_000);
    expect(await tokenBlacklist.has('meu-token')).toBe(true);
  });

  it('destroy() limpa todos os tokens armazenados', async () => {
    await tokenBlacklist.add('token-1', Date.now() + 60_000);
    await tokenBlacklist.add('token-2', Date.now() + 60_000);
    tokenBlacklist.destroy();
    expect(await tokenBlacklist.has('token-1')).toBe(false);
    expect(await tokenBlacklist.has('token-2')).toBe(false);
  });
});
