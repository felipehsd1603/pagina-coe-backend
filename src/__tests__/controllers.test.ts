import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const mockPrisma = vi.hoisted(() => ({
  app: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
  demand: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  testimonial: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  course: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  user: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
}));

vi.mock('../config/database', () => ({ default: mockPrisma }));
vi.mock('../../config/database', () => ({ default: mockPrisma }));
vi.mock('../config/env', () => ({ env: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long', AUTH_MODE: 'mock' } }));

import { listApps, getAppBySlug } from '../controllers/apps.controller';
import { createDemand } from '../controllers/demands.controller';
import { adminListApps, adminUpdateApp, adminDeleteApp } from '../controllers/admin/apps.admin.controller';
import { adminListDemands, adminUpdateDemand, adminDeleteDemand } from '../controllers/admin/demands.admin.controller';
import { adminListTestimonials, adminCreateTestimonial, adminDeleteTestimonial } from '../controllers/admin/testimonials.admin.controller';
import { adminListCourses, adminCreateCourse, adminDeleteCourse } from '../controllers/admin/courses.admin.controller';
import { adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser } from '../controllers/admin/users.admin.controller';

function mockReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: {}, params: {}, headers: {}, user: undefined, ...overrides } as unknown as Request;
}
function mockRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis() } as unknown as Response;
}
const next: NextFunction = vi.fn();

describe('Apps Controller', () => {
  beforeEach(() => vi.clearAllMocks());
  it('listApps paginated', async () => { mockPrisma.app.findMany.mockResolvedValue([{ id: '1' }]); mockPrisma.app.count.mockResolvedValue(1); const res = mockRes(); await listApps(mockReq({ query: { page: '1', limit: '10' } }), res, next); expect(res.json).toHaveBeenCalledWith({ data: [{ id: '1' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }); });
  it('listApps filter', async () => { mockPrisma.app.findMany.mockResolvedValue([]); mockPrisma.app.count.mockResolvedValue(0); const res = mockRes(); await listApps(mockReq({ query: { category: 'OPERACIONAL' } }), res, next); expect(mockPrisma.app.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ category: 'OPERACIONAL' }) })); });
  it('getAppBySlug 404', async () => { mockPrisma.app.findUnique.mockResolvedValue(null); const res = mockRes(); await getAppBySlug(mockReq({ params: { slug: 'x' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(404); });
  it('getAppBySlug ok', async () => { mockPrisma.app.findUnique.mockResolvedValue({ id: '1', slug: 'a' }); const res = mockRes(); await getAppBySlug(mockReq({ params: { slug: 'a' } }) as any, res, next); expect(res.json).toHaveBeenCalledWith({ id: '1', slug: 'a' }); });
});

describe('Demands Controller', () => {
  beforeEach(() => vi.clearAllMocks());
  it('create valid', async () => { const d = { title: 'Nova automacao', description: 'Preciso automatizar processo', requesterName: 'Felipe', requesterEmail: 'felipe@aegea.com', area: 'TI', lgpdConsent: true }; mockPrisma.demand.create.mockResolvedValue({ id: '1', ...d, status: 'PENDING', priority: 'MEDIUM' }); const res = mockRes(); await createDemand(mockReq({ body: d }), res, next); expect(res.status).toHaveBeenCalledWith(201); });
  it('reject short title', async () => { const res = mockRes(); await createDemand(mockReq({ body: { title: 'ab' } }), res, next); expect(res.status).toHaveBeenCalledWith(400); });
  it('reject bad email', async () => { const res = mockRes(); await createDemand(mockReq({ body: { title: 'Test', description: 'Long enough desc here', requesterName: 'F', requesterEmail: 'bad', area: 'TI' } }), res, next); expect(res.status).toHaveBeenCalledWith(400); });
});

describe('Admin Apps', () => {
  beforeEach(() => vi.clearAllMocks());
  it('list', async () => { mockPrisma.app.findMany.mockResolvedValue([]); mockPrisma.app.count.mockResolvedValue(0); const res = mockRes(); await adminListApps(mockReq(), res, next); expect(res.json).toHaveBeenCalledWith({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }); });
  it('reject bad URL', async () => { const res = mockRes(); await adminUpdateApp(mockReq({ params: { id: '1' }, body: { bannerUrl: 'bad' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(400); });
  it('delete', async () => { mockPrisma.app.delete.mockResolvedValue({}); const res = mockRes(); await adminDeleteApp(mockReq({ params: { id: '1' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(204); });
});

describe('Admin Demands', () => {
  beforeEach(() => vi.clearAllMocks());
  it('reject invalid status', async () => { const res = mockRes(); await adminUpdateDemand(mockReq({ params: { id: '1' }, body: { status: 'X' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(400); });
  it('delete', async () => { mockPrisma.demand.delete.mockResolvedValue({}); const res = mockRes(); await adminDeleteDemand(mockReq({ params: { id: '1' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(204); });
});

describe('Admin Testimonials', () => {
  beforeEach(() => vi.clearAllMocks());
  it('create', async () => { mockPrisma.testimonial.create.mockResolvedValue({ id: '1' }); const res = mockRes(); await adminCreateTestimonial(mockReq({ body: { authorName: 'M', authorRole: 'A', content: 'O', rating: 5 } }), res, next); expect(res.status).toHaveBeenCalledWith(201); });
  it('reject rating>5', async () => { const res = mockRes(); await adminCreateTestimonial(mockReq({ body: { authorName: 'M', authorRole: 'A', content: 'O', rating: 10 } }), res, next); expect(res.status).toHaveBeenCalledWith(400); });
  it('delete', async () => { mockPrisma.testimonial.delete.mockResolvedValue({}); const res = mockRes(); await adminDeleteTestimonial(mockReq({ params: { id: '1' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(204); });
});

describe('Admin Courses', () => {
  beforeEach(() => vi.clearAllMocks());
  it('create', async () => { mockPrisma.course.create.mockResolvedValue({ id: '1' }); const res = mockRes(); await adminCreateCourse(mockReq({ body: { title: 'PA', description: 'I', tier: 'T1' } }), res, next); expect(res.status).toHaveBeenCalledWith(201); });
  it('reject bad tier', async () => { const res = mockRes(); await adminCreateCourse(mockReq({ body: { title: 'C', description: 'D', tier: 'X' } }), res, next); expect(res.status).toHaveBeenCalledWith(400); });
  it('delete', async () => { mockPrisma.course.delete.mockResolvedValue({}); const res = mockRes(); await adminDeleteCourse(mockReq({ params: { id: '1' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(204); });
});

describe('Admin Users', () => {
  beforeEach(() => vi.clearAllMocks());
  it('create', async () => { mockPrisma.user.findUnique.mockResolvedValue(null); mockPrisma.user.create.mockResolvedValue({ id: '1' }); const res = mockRes(); await adminCreateUser(mockReq({ body: { email: 'n@a.com', name: 'N', role: 'VIEWER' } }), res, next); expect(res.status).toHaveBeenCalledWith(201); });
  it('reject dup', async () => { mockPrisma.user.findUnique.mockResolvedValue({ id: '1' }); const res = mockRes(); await adminCreateUser(mockReq({ body: { email: 'd@t.com', name: 'D' } }), res, next); expect(res.status).toHaveBeenCalledWith(409); });
  it('reject bad email', async () => { const res = mockRes(); await adminCreateUser(mockReq({ body: { email: 'bad', name: 'B' } }), res, next); expect(res.status).toHaveBeenCalledWith(400); });
  it('no self-delete', async () => { const res = mockRes(); await adminDeleteUser(mockReq({ params: { id: '1' }, user: { id: '1', email: 'a@a.com', name: 'A', role: 'ADMIN' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(400); });
  it('protect last admin', async () => { mockPrisma.user.findUnique.mockResolvedValue({ id: '1', role: 'ADMIN' }); mockPrisma.user.count.mockResolvedValue(1); const res = mockRes(); await adminUpdateUser(mockReq({ params: { id: '1' }, body: { role: 'VIEWER' } }) as any, res, next); expect(res.status).toHaveBeenCalledWith(400); });
});
