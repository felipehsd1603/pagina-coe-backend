import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import {
  adminListApps, adminUpdateApp,
} from '../controllers/admin/apps.admin.controller';
import {
  adminListTestimonials, adminCreateTestimonial, adminUpdateTestimonial, adminDeleteTestimonial,
} from '../controllers/admin/testimonials.admin.controller';
import {
  adminListDemands, adminUpdateDemand, adminDeleteDemand,
} from '../controllers/admin/demands.admin.controller';
import {
  adminListCourses, adminCreateCourse, adminUpdateCourse, adminDeleteCourse,
} from '../controllers/admin/courses.admin.controller';
import {
  adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
} from '../controllers/admin/users.admin.controller';

export const adminRouter = Router();

// All admin routes require authentication
adminRouter.use(authMiddleware);

// ─── Users (ADMIN only) ──────────────────────────────────

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Listar usuarios
 *     description: "Requer role: ADMIN"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *   post:
 *     tags: [Admin - Users]
 *     summary: Criar usuario
 *     description: "Requer role: ADMIN"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@empresa.com.br"
 *               name:
 *                 type: string
 *                 example: "Nome do Usuario"
 *               role:
 *                 type: string
 *                 enum: [VIEWER, EDITOR, ADMIN]
 *                 default: VIEWER
 *               entraId:
 *                 type: string
 *                 description: ID do Microsoft Entra (opcional)
 *     responses:
 *       201:
 *         description: Usuario criado
 *       409:
 *         description: Email ja cadastrado
 */
adminRouter.get('/users', requireRole('ADMIN'), adminListUsers);
adminRouter.post('/users', requireRole('ADMIN'), adminCreateUser);

/**
 * @openapi
 * /admin/users/{id}:
 *   put:
 *     tags: [Admin - Users]
 *     summary: Atualizar usuario (nome, role)
 *     description: "Requer role: ADMIN. Nao permite remover o ultimo admin."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, EDITOR, ADMIN]
 *     responses:
 *       200:
 *         description: Usuario atualizado
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Excluir usuario
 *     description: "Requer role: ADMIN. Nao permite auto-exclusao nem remover ultimo admin."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Usuario excluido
 */
adminRouter.put('/users/:id', requireRole('ADMIN'), adminUpdateUser);
adminRouter.delete('/users/:id', requireRole('ADMIN'), adminDeleteUser);

// ─── Apps (VIEWER pode ver, EDITOR pode editar) ──────────

/**
 * @openapi
 * /admin/apps:
 *   get:
 *     tags: [Admin - Apps]
 *     summary: Listar apps para enriquecimento editorial
 *     description: "Requer role: VIEWER ou superior"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de apps
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/App'
 */
adminRouter.get('/apps', requireRole('VIEWER'), adminListApps);

/**
 * @openapi
 * /admin/apps/{id}:
 *   put:
 *     tags: [Admin - Apps]
 *     summary: Enriquecer app (descricao, banner, beneficios, docs)
 *     description: "Requer role: EDITOR ou superior"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               bannerUrl:
 *                 type: string
 *               iconUrl:
 *                 type: string
 *               published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: App atualizado
 */
adminRouter.put('/apps/:id', requireRole('EDITOR'), adminUpdateApp);

// ─── Testimonials ────────────────────────────────────────

/**
 * @openapi
 * /admin/testimonials:
 *   get:
 *     tags: [Admin - Testimonials]
 *     summary: Listar depoimentos (admin)
 *     description: "Requer role: VIEWER ou superior"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de depoimentos
 *   post:
 *     tags: [Admin - Testimonials]
 *     summary: Criar depoimento
 *     description: "Requer role: EDITOR ou superior"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Testimonial'
 *     responses:
 *       201:
 *         description: Depoimento criado
 */
adminRouter.get('/testimonials', requireRole('VIEWER'), adminListTestimonials);
adminRouter.post('/testimonials', requireRole('EDITOR'), adminCreateTestimonial);

/**
 * @openapi
 * /admin/testimonials/{id}:
 *   put:
 *     tags: [Admin - Testimonials]
 *     summary: Atualizar depoimento
 *     description: "Requer role: EDITOR ou superior"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Depoimento atualizado
 *   delete:
 *     tags: [Admin - Testimonials]
 *     summary: Excluir depoimento
 *     description: "Requer role: ADMIN"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Depoimento excluido
 */
adminRouter.put('/testimonials/:id', requireRole('EDITOR'), adminUpdateTestimonial);
adminRouter.delete('/testimonials/:id', requireRole('ADMIN'), adminDeleteTestimonial);

// ─── Demands ─────────────────────────────────────────────

/**
 * @openapi
 * /admin/demands:
 *   get:
 *     tags: [Admin - Demands]
 *     summary: Listar demandas (admin)
 *     description: "Requer role: VIEWER ou superior"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de demandas
 */
adminRouter.get('/demands', requireRole('VIEWER'), adminListDemands);

/**
 * @openapi
 * /admin/demands/{id}:
 *   put:
 *     tags: [Admin - Demands]
 *     summary: Atualizar demanda (status, notas, prioridade)
 *     description: "Requer role: EDITOR ou superior"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Demanda atualizada
 *   delete:
 *     tags: [Admin - Demands]
 *     summary: Excluir demanda
 *     description: "Requer role: ADMIN"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Demanda excluida
 */
adminRouter.put('/demands/:id', requireRole('EDITOR'), adminUpdateDemand);
adminRouter.delete('/demands/:id', requireRole('ADMIN'), adminDeleteDemand);

// ─── Courses ─────────────────────────────────────────────

/**
 * @openapi
 * /admin/courses:
 *   get:
 *     tags: [Admin - Courses]
 *     summary: Listar cursos (admin)
 *     description: "Requer role: VIEWER ou superior"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cursos
 *   post:
 *     tags: [Admin - Courses]
 *     summary: Criar curso
 *     description: "Requer role: EDITOR ou superior"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: Curso criado
 */
adminRouter.get('/courses', requireRole('VIEWER'), adminListCourses);
adminRouter.post('/courses', requireRole('EDITOR'), adminCreateCourse);

/**
 * @openapi
 * /admin/courses/{id}:
 *   put:
 *     tags: [Admin - Courses]
 *     summary: Atualizar curso
 *     description: "Requer role: EDITOR ou superior"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Curso atualizado
 *   delete:
 *     tags: [Admin - Courses]
 *     summary: Excluir curso
 *     description: "Requer role: ADMIN"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Curso excluido
 */
adminRouter.put('/courses/:id', requireRole('EDITOR'), adminUpdateCourse);
adminRouter.delete('/courses/:id', requireRole('ADMIN'), adminDeleteCourse);
