import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../config/logger';

export const healthRouter = Router();

/**
 * GET /healthz — Liveness probe
 * Returns 200 if the process is alive. No dependency checks.
 */
healthRouter.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /readyz — Readiness probe
 * Tests database connectivity via Prisma. Returns 503 if DB is unreachable.
 */
healthRouter.get('/readyz', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, 'Readiness probe: database check failed');
    res.status(503).json({ status: 'unavailable', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});
