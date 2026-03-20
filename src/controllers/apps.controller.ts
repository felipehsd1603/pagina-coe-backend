import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function listApps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      category,
      phase,
      search,
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (category && typeof category === 'string') {
      where.category = category;
    }
    if (phase && typeof phase === 'string') {
      where.phase = phase;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [apps, total] = await Promise.all([
      prisma.app.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          benefits: true,
          metrics: true,
        },
      }),
      prisma.app.count({ where }),
    ]);

    res.json({
      data: apps,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAppBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { slug } = req.params;

    const app = await prisma.app.findUnique({
      where: { slug },
      include: {
        benefits: true,
        documents: true,
        metrics: true,
        relatedFlows: true,
        testimonials: true,
      },
    });

    if (!app) {
      res.status(404).json({ error: 'App nao encontrado' });
      return;
    }

    res.json(app);
  } catch (error) {
    next(error);
  }
}
