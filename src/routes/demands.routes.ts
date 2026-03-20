import { Router } from 'express';
import { createDemand } from '../controllers/demands.controller';

export const demandsRouter = Router();

/**
 * @openapi
 * /demands:
 *   post:
 *     tags: [Demands]
 *     summary: Enviar nova demanda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemandCreate'
 *     responses:
 *       201:
 *         description: Demanda criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Demand'
 *       400:
 *         description: Dados invalidos
 */
demandsRouter.post('/', createDemand);
