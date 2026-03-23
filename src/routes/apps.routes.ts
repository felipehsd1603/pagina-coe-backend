import { Router } from 'express';
import { listApps, getAppBySlug } from '../controllers/apps.controller';
import { optionalAuth } from '../middleware/authMiddleware';

export const appsRouter = Router();

/**
 * @openapi
 * /apps:
 *   get:
 *     tags: [Apps]
 *     summary: Listar apps publicados (ownerEmail oculto sem auth - LGPD)
 */
appsRouter.get('/', optionalAuth, listApps);

/**
 * @openapi
 * /apps/{slug}:
 *   get:
 *     tags: [Apps]
 *     summary: Detalhe do app por slug (ownerEmail oculto sem auth - LGPD)
 */
appsRouter.get('/:slug', optionalAuth, getAppBySlug);
