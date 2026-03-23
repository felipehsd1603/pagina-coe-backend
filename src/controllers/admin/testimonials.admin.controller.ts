import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const testimonialSchema = z.object({
  authorName: z.string().min(1).max(200),
  authorRole: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5),
  appId: z.string().uuid().optional().nullable(),
  published: z.boolean().optional(),
});

const testimonialUpdateSchema = testimonialSchema.partial();

export async function adminListTestimonials(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
      include: { app: { select: { id: true, name: true } } },
    });
    res.json(testimonials);
  } catch (error) {
    next(error);
  }
}

export async function adminCreateTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = testimonialSchema.parse(req.body);
    const testimonial = await prisma.testimonial.create({ data });
    res.status(201).json(testimonial);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminUpdateTestimonial(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = testimonialUpdateSchema.parse(req.body);
    const testimonial = await prisma.testimonial.update({ where: { id }, data });
    res.json(testimonial);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminDeleteTestimonial(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.testimonial.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
