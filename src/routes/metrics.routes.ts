import { Router } from 'express';
import { listMetrics } from '../controllers/metrics.controller';

export const metricsRouter = Router();

/**
 * @openapi
 * /metrics:
 *   get:
 *     tags: [Metrics]
 *     summary: KPIs globais do CoE
 *     responses:
 *       200:
 *         description: Lista de metricas globais
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GlobalMetric'
 */
metricsRouter.get('/', listMetrics);
