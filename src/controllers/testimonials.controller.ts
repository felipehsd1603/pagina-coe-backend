import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function listTestimonials(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { appId } = req.query;

    const where: Record<string, unknown> = { published: true };

    if (appId && typeof appId === 'string') {
      where.appId = appId;
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        app: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json(testimonials);
  } catch (error) {
    next(error);
  }
}
