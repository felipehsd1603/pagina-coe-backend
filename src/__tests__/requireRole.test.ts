/**
 * Testes unitarios — requireRole e requireFeature
 *
 * Cobre:
 *  - requireRole: sem usuario (401), role insuficiente (403), role exata, hierarquia,
 *    multiplos roles aceitos, role desconhecida, nivel limite (boundary)
 *  - requireFeature: sem usuario (401), feature habilitada para role, feature
 *    desabilitada para role, role desconhecida, cada feature exclusiva de ADMIN
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { requireRole } from '../middleware/requireRole';
import { requireFeature } from '../middleware/requireRole';

// features.ts nao tem dependencias externas — importado diretamente sem mock
import { ROLE_FEATURES, type Feature } from '../config/features';

// ─── helpers ─────────────────────────────────────────────────────────────────

function mockReq(user?: { id: string; email: string; name: string; role: string }): Request {
  return {
    headers: {},
    user,
  } as unknown as Request;
}

function mockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

// ─────────────────────────────────────────────────────────────────────────────
// requireRole
// ─────────────────────────────────────────────────────────────────────────────

describe('requireRole', () => {
  // ── Sem usuario autenticado ───────────────────────────────────────────────

  it('deve retornar 401 quando req.user nao esta definido', () => {
    const mw = requireRole('VIEWER');
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Autenticacao necessaria' });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Happy path: role exata ────────────────────────────────────────────────

  it('deve chamar next() quando usuario tem exatamente a role requerida (VIEWER)', () => {
    const mw = requireRole('VIEWER');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deve chamar next() quando usuario tem exatamente a role requerida (EDITOR)', () => {
    const mw = requireRole('EDITOR');
    const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve chamar next() quando usuario tem exatamente a role requerida (ADMIN)', () => {
    const mw = requireRole('ADMIN');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // ── Hierarquia: roles superiores devem passar ─────────────────────────────

  it('deve chamar next() quando ADMIN tenta acessar rota que requer EDITOR', () => {
    const mw = requireRole('EDITOR');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve chamar next() quando ADMIN tenta acessar rota que requer VIEWER', () => {
    const mw = requireRole('VIEWER');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve chamar next() quando EDITOR tenta acessar rota que requer VIEWER', () => {
    const mw = requireRole('VIEWER');
    const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // ── Hierarquia: roles inferiores devem ser bloqueadas ─────────────────────

  it('deve retornar 403 quando VIEWER tenta acessar rota que requer EDITOR', () => {
    const mw = requireRole('EDITOR');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Permissao insuficiente' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando VIEWER tenta acessar rota que requer ADMIN', () => {
    const mw = requireRole('ADMIN');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando EDITOR tenta acessar rota que requer ADMIN', () => {
    const mw = requireRole('ADMIN');
    const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Multiplos roles aceitos ───────────────────────────────────────────────

  it('deve aceitar VIEWER quando requireRole recebe multiplos roles: VIEWER, EDITOR', () => {
    const mw = requireRole('VIEWER', 'EDITOR');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve aceitar ADMIN quando requireRole recebe apenas VIEWER (hierarquia)', () => {
    // ADMIN (level 3) >= VIEWER (level 1) -> passa
    const mw = requireRole('VIEWER');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // ── Role desconhecida / invalida ──────────────────────────────────────────

  it('deve retornar 403 quando usuario tem role desconhecida (ex: "SUPERUSER")', () => {
    // Role fora do enum nao tem nivel na hierarquia — deve ser bloqueada
    const mw = requireRole('VIEWER');
    const req = mockReq({ id: '1', email: 'x@aegea.mock', name: 'X', role: 'SUPERUSER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando usuario tem role vazia', () => {
    const mw = requireRole('VIEWER');
    const req = mockReq({ id: '1', email: 'x@aegea.mock', name: 'X', role: '' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Boundary: nivel exato no limite ──────────────────────────────────────

  it('limite inferior exato — VIEWER (nivel 1) satisfaz requireRole("VIEWER") (minimo 1)', () => {
    const mw = requireRole('VIEWER');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('limite superior exato — ADMIN (nivel 3) satisfaz requireRole("ADMIN") (minimo 3)', () => {
    const mw = requireRole('ADMIN');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requireFeature
// ─────────────────────────────────────────────────────────────────────────────

describe('requireFeature', () => {
  // ── Sem usuario autenticado ───────────────────────────────────────────────

  it('deve retornar 401 quando req.user nao esta definido', () => {
    const mw = requireFeature('apps');
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Autenticacao necessaria' });
    expect(next).not.toHaveBeenCalled();
  });

  // ── Features disponiveis para VIEWER ─────────────────────────────────────

  it('deve chamar next() quando VIEWER acessa feature "apps" (habilitada para VIEWER)', () => {
    const mw = requireFeature('apps');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve chamar next() quando VIEWER acessa feature "dashboard" (habilitada para VIEWER)', () => {
    const mw = requireFeature('dashboard');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // ── Features bloqueadas para VIEWER ──────────────────────────────────────

  it('deve retornar 403 quando VIEWER tenta acessar feature "apps.manage" (apenas EDITOR+)', () => {
    const mw = requireFeature('apps.manage');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Permissao insuficiente para esta funcionalidade' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando VIEWER tenta acessar feature "users" (apenas ADMIN)', () => {
    const mw = requireFeature('users');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando VIEWER tenta acessar feature "coe-sync" (apenas ADMIN)', () => {
    const mw = requireFeature('coe-sync');
    const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Features para EDITOR ─────────────────────────────────────────────────

  it('deve chamar next() quando EDITOR acessa feature "demands.manage"', () => {
    const mw = requireFeature('demands.manage');
    const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve chamar next() quando EDITOR acessa feature "testimonials.manage"', () => {
    const mw = requireFeature('testimonials.manage');
    const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve retornar 403 quando EDITOR tenta acessar feature "users" (apenas ADMIN)', () => {
    const mw = requireFeature('users');
    const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando EDITOR tenta acessar feature "metrics.manage" (apenas ADMIN)', () => {
    const mw = requireFeature('metrics.manage');
    const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Features exclusivas de ADMIN ─────────────────────────────────────────

  it('deve chamar next() quando ADMIN acessa feature "users" (exclusiva de ADMIN)', () => {
    const mw = requireFeature('users');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve chamar next() quando ADMIN acessa feature "coe-sync" (exclusiva de ADMIN)', () => {
    const mw = requireFeature('coe-sync');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve chamar next() quando ADMIN acessa feature "metrics.manage" (exclusiva de ADMIN)', () => {
    const mw = requireFeature('metrics.manage');
    const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // ── Role desconhecida ─────────────────────────────────────────────────────

  it('deve retornar 403 quando usuario tem role desconhecida para qualquer feature', () => {
    const mw = requireFeature('dashboard');
    const req = mockReq({ id: '1', email: 'x@aegea.mock', name: 'X', role: 'GOD_MODE' });
    const res = mockRes();
    const next = vi.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Consistencia com ROLE_FEATURES ───────────────────────────────────────
  // Valida que o middleware esta alinhado com a tabela de features definida em config/features.ts

  it('todas as features do VIEWER devem passar quando usuario e VIEWER', () => {
    for (const feature of ROLE_FEATURES.VIEWER) {
      const mw = requireFeature(feature);
      const req = mockReq({ id: '1', email: 'v@aegea.mock', name: 'Viewer', role: 'VIEWER' });
      const res = mockRes();
      const next = vi.fn();

      mw(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(403);
    }
  });

  it('todas as features do EDITOR devem passar quando usuario e EDITOR', () => {
    for (const feature of ROLE_FEATURES.EDITOR) {
      const mw = requireFeature(feature);
      const req = mockReq({ id: '1', email: 'e@aegea.mock', name: 'Editor', role: 'EDITOR' });
      const res = mockRes();
      const next = vi.fn();

      mw(req, res, next);

      expect(next).toHaveBeenCalled();
    }
  });

  it('todas as features do ADMIN devem passar quando usuario e ADMIN', () => {
    for (const feature of ROLE_FEATURES.ADMIN) {
      const mw = requireFeature(feature);
      const req = mockReq({ id: '1', email: 'a@aegea.mock', name: 'Admin', role: 'ADMIN' });
      const res = mockRes();
      const next = vi.fn();

      mw(req, res, next);

      expect(next).toHaveBeenCalled();
    }
  });

  it('features exclusivas de ADMIN devem ser bloqueadas para VIEWER e EDITOR', () => {
    // Features presentes em ADMIN mas nao em VIEWER ou EDITOR
    const viewerSet = new Set<Feature>(ROLE_FEATURES.VIEWER);
    const editorSet = new Set<Feature>(ROLE_FEATURES.EDITOR);
    const adminOnly = ROLE_FEATURES.ADMIN.filter(
      (f) => !viewerSet.has(f) && !editorSet.has(f)
    );

    for (const feature of adminOnly) {
      for (const role of ['VIEWER', 'EDITOR'] as const) {
        const mw = requireFeature(feature);
        const req = mockReq({ id: '1', email: `t@aegea.mock`, name: 'T', role });
        const res = mockRes();
        const next = vi.fn();

        mw(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      }
    }
  });
});
