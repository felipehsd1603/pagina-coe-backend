import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminGuard } from '../middleware/adminGuard';
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

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminGuard);

// ─── Apps (somente leitura + enriquecimento editorial) ──
// Criar/deletar apps NAO e necessario — dados vem do CoE Sync

/**
 * @openapi
 * /admin/apps:
 *   get:
 *     tags: [Admin - Apps]
 *     summary: Listar apps para enriquecimento editorial
 *     description: Apps sao sincronizados do CoE. Aqui o admin edita campos como descricao, banner, beneficios.
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
adminRouter.get('/apps', adminListApps);

/**
 * @openapi
 * /admin/apps/{id}:
 *   put:
 *     tags: [Admin - Apps]
 *     summary: Enriquecer app (descricao, banner, beneficios, docs)
 *     description: Edita apenas campos editoriais. Dados tecnicos (owner, ambiente, conectores) vem do CoE.
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
adminRouter.put('/apps/:id', adminUpdateApp);

// ─── Testimonials (CRUD completo) ───────────────────────

/**
 * @openapi
 * /admin/testimonials:
 *   get:
 *     tags: [Admin - Testimonials]
 *     summary: Listar depoimentos (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de depoimentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Testimonial'
 *   post:
 *     tags: [Admin - Testimonials]
 *     summary: Criar depoimento
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
adminRouter.get('/testimonials', adminListTestimonials);
adminRouter.post('/testimonials', adminCreateTestimonial);

/**
 * @openapi
 * /admin/testimonials/{id}:
 *   put:
 *     tags: [Admin - Testimonials]
 *     summary: Atualizar depoimento
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
adminRouter.put('/testimonials/:id', adminUpdateTestimonial);
adminRouter.delete('/testimonials/:id', adminDeleteTestimonial);

// ─── Demands (CRUD completo) ────────────────────────────

/**
 * @openapi
 * /admin/demands:
 *   get:
 *     tags: [Admin - Demands]
 *     summary: Listar demandas (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de demandas
 */
adminRouter.get('/demands', adminListDemands);

/**
 * @openapi
 * /admin/demands/{id}:
 *   put:
 *     tags: [Admin - Demands]
 *     summary: Atualizar demanda (status, notas, prioridade)
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
adminRouter.put('/demands/:id', adminUpdateDemand);
adminRouter.delete('/demands/:id', adminDeleteDemand);

// ─── Metricas REMOVIDAS — calculadas automaticamente do CoE ──
// Use GET /coe/sync para obter metricas atualizadas

// ─── Courses (CRUD completo) ────────────────────────────

/**
 * @openapi
 * /admin/courses:
 *   get:
 *     tags: [Admin - Courses]
 *     summary: Listar cursos (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cursos
 *   post:
 *     tags: [Admin - Courses]
 *     summary: Criar curso
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
adminRouter.get('/courses', adminListCourses);
adminRouter.post('/courses', adminCreateCourse);

/**
 * @openapi
 * /admin/courses/{id}:
 *   put:
 *     tags: [Admin - Courses]
 *     summary: Atualizar curso
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
adminRouter.put('/courses/:id', adminUpdateCourse);
adminRouter.delete('/courses/:id', adminDeleteCourse);
