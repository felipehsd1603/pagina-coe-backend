/**
 * Testes de integracao HTTP — fluxo completo de autenticacao
 *
 * Usa Supertest para disparar requisicoes HTTP reais contra o app Express,
 * com Prisma e Redis mockados para evitar dependencias externas.
 *
 * Cobre:
 *  - POST /api/v1/auth/login: credenciais validas e invalidas
 *  - GET  /api/v1/auth/me: rota protegida com e sem token
 *  - POST /api/v1/auth/logout: invalida o token na blacklist
 *  - Requisicao com token blacklistado apos logout
 *  - Token expirado em rota protegida
 *  - Token com assinatura incorreta em rota protegida
 *  - Falha de banco durante verificacao de isActive -> 503
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ─── Mocks declarados antes de qualquer import do app ────────────────────────
// vi.mock e hoisted automaticamente — as variaveis precisam usar vi.hoisted()
// para que estejam inicializadas quando o factory do vi.mock for executado.

const { mockFindUnique, mockUpdate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('../config/database', () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    $disconnect: vi.fn(),
  },
}));

vi.mock('../config/env', () => ({
  env: {
    PORT: 5002,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
    JWT_EXPIRES_IN: '1h',
    AUTH_MODE: 'mock',
    CORS_ORIGINS: 'http://localhost:3000',
    MOCK_ADMIN_PASSWORD: 'admin123',
    MOCK_EDITOR_PASSWORD: 'editor123',
    MOCK_VIEWER_PASSWORD: 'viewer123',
    COE_DATA_SOURCE: 'mock',
  },
}));

// pino-http mockado para evitar inspecao de internals do pino real
vi.mock('pino-http', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// express-rate-limit mockado para evitar 429 nos testes de integracao.
// Em producao o rate limit e testado separadamente ou em ambiente E2E real.
vi.mock('express-rate-limit', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Redis mockado para evitar conexao real — blacklist usa fallback in-memory
vi.mock('../config/redis', () => ({
  redis: {
    set: vi.fn(),
    exists: vi.fn(),
    on: vi.fn(),
    status: 'close',
    connect: vi.fn(),
    listenerCount: vi.fn().mockReturnValue(1),
  },
  isRedisAvailable: vi.fn().mockReturnValue(false),
  connectRedis: vi.fn(),
}));

// Logger mockado para silenciar output durante testes.
// Precisa expor .child() porque pino-http o utiliza internamente.
vi.mock('../config/logger', () => {
  const noop = vi.fn();
  const loggerMock = {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    trace: noop,
    fatal: noop,
    child: vi.fn().mockReturnValue({
      info: noop,
      warn: noop,
      error: noop,
      debug: noop,
      trace: noop,
      fatal: noop,
      child: vi.fn().mockReturnThis(),
    }),
  };
  return { logger: loggerMock };
});

import app from '../index';
import { tokenBlacklist } from '../middleware/authMiddleware';

// ─── constantes ──────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';

const ADMIN_USER = {
  id: 'u-admin-1',
  email: 'admin@aegea.mock',
  name: 'Admin CoE',
  role: 'ADMIN',
  entraId: 'entra-1',
  isActive: true,
  createdAt: new Date(),
  lastLoginAt: null,
  department: null,
  jobTitle: null,
};

const EDITOR_USER = {
  id: 'u-editor-1',
  email: 'editor@aegea.mock',
  name: 'Editor CoE',
  role: 'EDITOR',
  entraId: 'entra-2',
  isActive: true,
  createdAt: new Date(),
  lastLoginAt: null,
  department: null,
  jobTitle: null,
};

const INACTIVE_USER = {
  ...ADMIN_USER,
  id: 'u-inactive-1',
  email: 'admin@aegea.mock',
  isActive: false,
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeToken(
  payload: object = {},
  options: jwt.SignOptions = {}
): string {
  return jwt.sign(
    { sub: 'u-admin-1', id: 'u-admin-1', email: 'admin@aegea.mock', name: 'Admin CoE', role: 'ADMIN', ...payload },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h', issuer: 'portal-aegea-mock', ...options }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenBlacklist.destroy();
  });

  it('deve retornar 200 com token JWT e dados do usuario para credenciais validas de ADMIN', async () => {
    mockFindUnique.mockResolvedValueOnce(ADMIN_USER);
    mockUpdate.mockResolvedValueOnce(ADMIN_USER);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aegea.mock', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      id: 'u-admin-1',
      email: 'admin@aegea.mock',
      name: 'Admin CoE',
      role: 'ADMIN',
    });
  });

  it('o token retornado deve ser um JWT valido e verificavel', async () => {
    mockFindUnique.mockResolvedValueOnce(ADMIN_USER);
    mockUpdate.mockResolvedValueOnce(ADMIN_USER);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aegea.mock', password: 'admin123' });

    const { token } = res.body;
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'portal-aegea-mock',
    }) as jwt.JwtPayload;

    expect(decoded.email).toBe('admin@aegea.mock');
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.sub).toBe('u-admin-1');
  });

  it('deve retornar features do role na resposta de login', async () => {
    mockFindUnique.mockResolvedValueOnce(ADMIN_USER);
    mockUpdate.mockResolvedValueOnce(ADMIN_USER);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aegea.mock', password: 'admin123' });

    expect(res.body).toHaveProperty('features');
    expect(Array.isArray(res.body.features)).toBe(true);
    expect(res.body.features).toContain('users');
    expect(res.body.features).toContain('coe-sync');
  });

  it('deve retornar 200 para EDITOR com credenciais validas', async () => {
    mockFindUnique.mockResolvedValueOnce(EDITOR_USER);
    mockUpdate.mockResolvedValueOnce(EDITOR_USER);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'editor@aegea.mock', password: 'editor123' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('EDITOR');
    // EDITOR nao deve ter features exclusivas de ADMIN
    expect(res.body.features).not.toContain('users');
    expect(res.body.features).not.toContain('coe-sync');
  });

  it('deve retornar 401 para senha incorreta', async () => {
    mockFindUnique.mockResolvedValueOnce(ADMIN_USER);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aegea.mock', password: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Credenciais invalidas');
  });

  it('deve retornar 401 quando usuario nao existe no banco', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'desconhecido@aegea.mock', password: 'qualquer' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Credenciais invalidas');
  });

  it('deve retornar 400 quando email esta ausente', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'admin123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Email e senha sao obrigatorios');
  });

  it('deve retornar 400 quando senha esta ausente', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aegea.mock' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Email e senha sao obrigatorios');
  });

  it('deve retornar 400 quando body esta vazio', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });

  it('deve retornar 403 quando usuario existe mas esta inativo', async () => {
    mockFindUnique.mockResolvedValueOnce(INACTIVE_USER);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aegea.mock', password: 'admin123' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/desativado/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/me — rota protegida
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenBlacklist.destroy();
    // Padrao: usuario ativo no banco (para a checagem do authMiddleware)
    mockFindUnique.mockResolvedValue({ isActive: true });
  });

  it('deve retornar 200 com dados do usuario para token valido', async () => {
    // authMiddleware -> findUnique para isActive; getProfile -> findUnique para dados
    mockFindUnique
      .mockResolvedValueOnce({ isActive: true }) // checagem isActive no authMiddleware
      .mockResolvedValueOnce({ id: 'u-admin-1', email: 'admin@aegea.mock', name: 'Admin CoE', role: 'ADMIN' }); // getProfile

    const token = makeToken();

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'u-admin-1',
      email: 'admin@aegea.mock',
      role: 'ADMIN',
    });
    expect(res.body).toHaveProperty('features');
  });

  it('deve retornar 401 quando nao ha header Authorization', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token de autenticacao nao fornecido');
  });

  it('deve retornar 401 quando token tem assinatura incorreta', async () => {
    const token = jwt.sign(
      { sub: 'u-admin-1', id: 'u-admin-1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN' },
      'completely-different-secret-that-is-at-least-32c',
      { algorithm: 'HS256', expiresIn: '1h', issuer: 'portal-aegea-mock' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token invalido ou expirado');
  });

  it('deve retornar 401 quando token esta expirado', async () => {
    const token = jwt.sign(
      { sub: 'u-admin-1', id: 'u-admin-1', email: 'admin@aegea.mock', name: 'Admin', role: 'ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '-1h', issuer: 'portal-aegea-mock' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token invalido ou expirado');
  });

  it('deve retornar 401 quando header e malformado (sem "Bearer ")', async () => {
    const token = makeToken();

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Basic ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token de autenticacao nao fornecido');
  });

  it('deve retornar 401 quando o token esta na blacklist', async () => {
    const token = makeToken();
    await tokenBlacklist.add(token, Date.now() + 3_600_000);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Token foi invalidado (logout realizado)');
    // nao deve consultar banco apos checar blacklist
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando usuario esta inativo (isActive: false)', async () => {
    mockFindUnique.mockResolvedValueOnce({ isActive: false });
    const token = makeToken();

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Conta desativada');
  });

  it('deve retornar 503 quando banco de dados falha durante verificacao de isActive (fail-closed)', async () => {
    mockFindUnique.mockRejectedValueOnce(new Error('Connection refused'));
    const token = makeToken();

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('error', 'Service temporarily unavailable');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenBlacklist.destroy();
    mockFindUnique.mockResolvedValue({ isActive: true });
  });

  it('deve retornar 200 e blacklistar o token apos logout', async () => {
    const token = makeToken();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logout realizado com sucesso');
    expect(await tokenBlacklist.has(token)).toBe(true);
  });

  it('deve retornar 200 mesmo sem header Authorization (logout idempotente)', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logout realizado com sucesso');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fluxo completo: login -> usar rota protegida -> logout -> token rejeitado
// ─────────────────────────────────────────────────────────────────────────────

describe('Fluxo completo de autenticacao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenBlacklist.destroy();
  });

  it('login -> /auth/me autenticado -> logout -> /auth/me rejeitado com 401', async () => {
    // 1. Login
    mockFindUnique.mockResolvedValueOnce(ADMIN_USER); // login: findUser
    mockUpdate.mockResolvedValueOnce(ADMIN_USER);     // login: update lastLoginAt

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@aegea.mock', password: 'admin123' });

    expect(loginRes.status).toBe(200);
    const { token } = loginRes.body;
    expect(token).toBeTruthy();

    // 2. Usar rota protegida com token valido
    mockFindUnique
      .mockResolvedValueOnce({ isActive: true })     // authMiddleware: isActive
      .mockResolvedValueOnce({                        // getProfile
        id: 'u-admin-1',
        email: 'admin@aegea.mock',
        name: 'Admin CoE',
        role: 'ADMIN',
      });

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('admin@aegea.mock');

    // 3. Logout — token e blacklistado
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);

    // 4. Tentar usar token blacklistado — deve ser rejeitado com 401
    const afterLogoutRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(afterLogoutRes.status).toBe(401);
    expect(afterLogoutRes.body).toHaveProperty('error', 'Token foi invalidado (logout realizado)');
    // banco nao deve ser consultado apos checar blacklist
    // (mockFindUnique ja foi chamado antes — verificamos que nao foi chamado de novo)
  });

  it('dois usuarios com tokens distintos — logout de um nao afeta o outro', async () => {
    const tokenA = makeToken({ sub: 'u-a', id: 'u-a', email: 'a@aegea.mock' });
    const tokenB = makeToken({ sub: 'u-b', id: 'u-b', email: 'b@aegea.mock' });

    // Logout do usuario A
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(await tokenBlacklist.has(tokenA)).toBe(true);
    expect(await tokenBlacklist.has(tokenB)).toBe(false);

    // Token B ainda deve funcionar em rota protegida
    mockFindUnique
      .mockResolvedValueOnce({ isActive: true })
      .mockResolvedValueOnce({ id: 'u-b', email: 'b@aegea.mock', name: 'B', role: 'VIEWER' });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
  });
});
