import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import {
  updateDemand,
  updateDemandSchema,
  adminDeleteDemand as adminDeleteDemandService,
} from '../../services/demand.service';

export async function adminListDemands(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.demand.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.demand.count(),
    ]);

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateDemand(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateDemandSchema.parse(req.body);
    const demand = await updateDemand(id, data);
    res.json(demand);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminDeleteDemand(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await adminDeleteDemandService(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
