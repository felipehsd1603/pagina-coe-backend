import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createDemand, deleteDemand } from '../controllers/demands.controller';
import { authMiddleware } from '../middleware/authMiddleware';

export const demandsRouter = Router();

// SECURITY: Stricter rate limit for unauthenticated demand creation (5 req/IP/hour)
const demandCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de envio de demandas atingido. Tente novamente em 1 hora.' },
});

/**
 * @openapi
 * /demands:
 *   post:
 *     tags: [Demands]
 *     summary: Enviar nova demanda
 */
demandsRouter.post('/', demandCreateLimiter, createDemand);

/**
 * @openapi
 * /demands/{id}:
 *   delete:
 *     tags: [Demands]
 *     summary: Excluir demanda (LGPD - direito de exclusao)
 *     description: Requer autenticacao. Solicitante pode deletar sua propria demanda ou admin pode deletar qualquer.
 *     security:
 *       - bearerAuth: []
 */
demandsRouter.delete('/:id', authMiddleware, deleteDemand);
