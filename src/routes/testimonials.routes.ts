import { Router } from 'express';
import { listTestimonials } from '../controllers/testimonials.controller';

export const testimonialsRouter = Router();

/**
 * @openapi
 * /testimonials:
 *   get:
 *     tags: [Testimonials]
 *     summary: Listar depoimentos publicados
 *     responses:
 *       200:
 *         description: Lista de depoimentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Testimonial'
 */
testimonialsRouter.get('/', listTestimonials);
