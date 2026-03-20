import { Router } from 'express';
import { listCourses } from '../controllers/courses.controller';

export const coursesRouter = Router();

/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Listar cursos do Citizen Developer
 *     parameters:
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [T1, T2, T3, T4]
 *     responses:
 *       200:
 *         description: Lista de cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */
coursesRouter.get('/', listCourses);
