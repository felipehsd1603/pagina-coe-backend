import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function listMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const metrics = await prisma.globalMetric.findMany({
      orderBy: { key: 'asc' },
    });

    res.json(metrics);
  } catch (error) {
    next(error);
  }
}
