import { Router } from 'express';
import { listApps, getAppBySlug } from '../controllers/apps.controller';

export const appsRouter = Router();

/**
 * @openapi
 * /apps:
 *   get:
 *     tags: [Apps]
 *     summary: Listar apps publicados
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [OPERACIONAL, COMERCIAL, CORPORATIVO, FINANCEIRO, ENGENHARIA, RH, SUSTENTABILIDADE, TI]
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *           enum: [IDEACAO, DESENVOLVIMENTO, HOMOLOGACAO, PRODUCAO, DESATIVADO]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista paginada de apps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/App'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
appsRouter.get('/', listApps);

/**
 * @openapi
 * /apps/{slug}:
 *   get:
 *     tags: [Apps]
 *     summary: Detalhe do app por slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: App com beneficios, documentos, metricas, fluxos e depoimentos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppDetail'
 *       404:
 *         description: App nao encontrado
 */
appsRouter.get('/:slug', getAppBySlug);
