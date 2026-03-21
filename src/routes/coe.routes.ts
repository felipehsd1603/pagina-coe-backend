import { Router, Request, Response, NextFunction } from 'express';
import {
  syncFromCoE, getCoeApps, getCoeFlows,
  getCoeMakers, getCoeEnvironments, getCoeConnectors,
} from '../services/coe-sync.service';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';

export const coeRouter = Router();

// All CoE routes require authentication + ADMIN role
coeRouter.use(authMiddleware, requireRole('ADMIN'));

/**
 * @openapi
 * /coe/sync:
 *   post:
 *     tags: [CoE Sync]
 *     summary: Disparar sincronizacao com CoE Starter Kit
 *     description: Puxa dados do Dataverse (mock em dev) e atualiza o banco local. Retorna resumo com metricas calculadas.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado da sincronizacao
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success, partial, error]
 *                 duration:
 *                   type: integer
 *                   description: Tempo em ms
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                       recordsFound:
 *                         type: integer
 *                       recordsSynced:
 *                         type: integer
 *                 computedMetrics:
 *                   type: object
 *                   properties:
 *                     totalApps:
 *                       type: integer
 *                     totalFlows:
 *                       type: integer
 *                     totalMakers:
 *                       type: integer
 *                     totalEnvironments:
 *                       type: integer
 */
coeRouter.post('/sync', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await syncFromCoE();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /coe/apps:
 *   get:
 *     tags: [CoE Sync]
 *     summary: Apps do CoE Starter Kit
 *     description: Retorna inventario de apps mapeado do Dataverse com categoria inferida
 *     responses:
 *       200:
 *         description: Lista de apps do CoE
 */
coeRouter.get('/apps', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const apps = await getCoeApps();
    res.json({ data: apps, total: apps.length });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /coe/flows:
 *   get:
 *     tags: [CoE Sync]
 *     summary: Flows do CoE Starter Kit
 *     description: Retorna inventario de fluxos Power Automate com link ao app pai
 *     responses:
 *       200:
 *         description: Lista de flows do CoE
 */
coeRouter.get('/flows', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const flows = await getCoeFlows();
    res.json({ data: flows, total: flows.length });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /coe/makers:
 *   get:
 *     tags: [CoE Sync]
 *     summary: Makers (Citizen Developers) do CoE
 *     description: Retorna lista de makers com contagem de apps e flows
 *     responses:
 *       200:
 *         description: Lista de makers
 */
coeRouter.get('/makers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const makers = await getCoeMakers();
    res.json({ data: makers, total: makers.length });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /coe/environments:
 *   get:
 *     tags: [CoE Sync]
 *     summary: Ambientes Power Platform
 *     description: Retorna ambientes com contagem de apps, flows e makers
 *     responses:
 *       200:
 *         description: Lista de ambientes
 */
coeRouter.get('/environments', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const envs = await getCoeEnvironments();
    res.json({ data: envs, total: envs.length });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /coe/connectors:
 *   get:
 *     tags: [CoE Sync]
 *     summary: Conectores em uso
 *     description: Retorna conectores com tier (Standard/Premium/Custom) e contagem de uso
 *     responses:
 *       200:
 *         description: Lista de conectores
 */
coeRouter.get('/connectors', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const connectors = await getCoeConnectors();
    res.json({ data: connectors, total: connectors.length });
  } catch (error) {
    next(error);
  }
});
