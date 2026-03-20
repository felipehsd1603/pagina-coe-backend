import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

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
    const testimonial = await prisma.testimonial.create({ data: req.body });
    res.status(201).json(testimonial);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const testimonial = await prisma.testimonial.update({ where: { id }, data: req.body });
    res.json(testimonial);
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.testimonial.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
