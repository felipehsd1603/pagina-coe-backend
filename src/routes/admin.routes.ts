import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
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
  adminListMetrics, adminUpsertMetric, adminDeleteMetric,
} from '../controllers/admin/metrics.admin.controller';
import {
  adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser, toggleUserActive,
} from '../controllers/admin/users.admin.controller';
import {
  adminListPages, adminTogglePage,
} from '../controllers/admin/pages.admin.controller';
import { syncEntraUsers } from '../services/entra-sync.service';

export const adminRouter = Router();

// All admin routes require authentication
adminRouter.use(authMiddleware);

// --- Users (ADMIN only) ---

adminRouter.get('/users', requireRole('ADMIN'), adminListUsers);
adminRouter.post('/users', requireRole('ADMIN'), adminCreateUser);

/**
 * @openapi
 * /admin/users/{id}/toggle-active:
 *   patch:
 *     tags: [Admin - Users]
 *     summary: Alternar status ativo/inativo do usuario
 *     description: "Requer role: ADMIN. Nao permite desativar a si mesmo nem o ultimo admin."
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
 *         description: Usuario atualizado com novo status
 *       400:
 *         description: Nao permitido (auto-desativacao ou ultimo admin)
 *       404:
 *         description: Usuario nao encontrado
 */
adminRouter.patch('/users/:id/toggle-active', requireRole('ADMIN'), toggleUserActive);

/**
 * @openapi
 * /admin/users/sync-entra:
 *   post:
 *     tags: [Admin - Users]
 *     summary: Sincronizar usuarios com grupo Entra ID (Azure AD)
 *     description: "Requer role: ADMIN. Sincroniza membros do grupo AD configurado."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado da sincronizacao
 *       400:
 *         description: Variaveis de ambiente Entra ID nao configuradas
 */
adminRouter.post('/users/sync-entra', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await syncEntraUsers();
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Variaveis de ambiente ausentes')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

/**
 * @openapi
 * /admin/users/{id}:
 *   put:
 *     tags: [Admin - Users]
 *     summary: Atualizar usuario (nome, role, department, jobTitle)
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
 *               department:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario atualizado
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Desativar ou excluir usuario
 *     description: "Requer role: ADMIN. Soft-delete por padrao. Use ?hard=true para hard-delete."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: hard
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Usuario desativado (soft delete)
 *       204:
 *         description: Usuario excluido permanentemente (hard delete)
 */
adminRouter.put('/users/:id', requireRole('ADMIN'), adminUpdateUser);
adminRouter.delete('/users/:id', requireRole('ADMIN'), adminDeleteUser);

// --- Apps (VIEWER pode ver, EDITOR pode editar) ---

adminRouter.get('/apps', requireRole('VIEWER'), adminListApps);
adminRouter.put('/apps/:id', requireRole('EDITOR'), adminUpdateApp);

// --- Testimonials ---

adminRouter.get('/testimonials', requireRole('VIEWER'), adminListTestimonials);
adminRouter.post('/testimonials', requireRole('EDITOR'), adminCreateTestimonial);
adminRouter.put('/testimonials/:id', requireRole('EDITOR'), adminUpdateTestimonial);
adminRouter.delete('/testimonials/:id', requireRole('ADMIN'), adminDeleteTestimonial);

// --- Demands ---

adminRouter.get('/demands', requireRole('VIEWER'), adminListDemands);
adminRouter.put('/demands/:id', requireRole('EDITOR'), adminUpdateDemand);
adminRouter.delete('/demands/:id', requireRole('ADMIN'), adminDeleteDemand);

// --- Courses ---

adminRouter.get('/courses', requireRole('VIEWER'), adminListCourses);
adminRouter.post('/courses', requireRole('EDITOR'), adminCreateCourse);
adminRouter.put('/courses/:id', requireRole('EDITOR'), adminUpdateCourse);
adminRouter.delete('/courses/:id', requireRole('ADMIN'), adminDeleteCourse);

// --- Metrics ---

adminRouter.get('/metrics', requireRole('VIEWER'), adminListMetrics);
adminRouter.post('/metrics', requireRole('EDITOR'), adminUpsertMetric);
adminRouter.delete('/metrics/:id', requireRole('ADMIN'), adminDeleteMetric);

// --- Page Visibility (ADMIN only) ---

adminRouter.get('/pages', requireRole('ADMIN'), adminListPages);
adminRouter.put('/pages/:id', requireRole('ADMIN'), adminTogglePage);
