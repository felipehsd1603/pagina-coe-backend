import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

export async function adminListMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const metrics = await prisma.globalMetric.findMany({ orderBy: { key: 'asc' } });
    res.json(metrics);
  } catch (error) {
    next(error);
  }
}

export async function adminUpsertMetric(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key, label, value, icon } = req.body;

    const metric = await prisma.globalMetric.upsert({
      where: { key },
      update: { label, value, icon },
      create: { key, label, value, icon },
    });

    res.json(metric);
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteMetric(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.globalMetric.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
