import { Router } from 'express';
import { mockLogin, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/authMiddleware';

export const authRouter = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login (mock)
 *     description: "Mock auth. Usuarios: admin@aegea.mock, editor@aegea.mock, viewer@aegea.mock (senha: admin)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Token JWT + dados do usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciais invalidas
 */
authRouter.post('/login', mockLogin);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuario logado
 *       401:
 *         description: Token invalido ou ausente
 */
authRouter.get('/me', authMiddleware, getMe);
