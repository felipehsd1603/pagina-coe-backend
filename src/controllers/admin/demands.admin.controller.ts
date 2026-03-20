import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

export async function adminListDemands(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const demands = await prisma.demand.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(demands);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const demand = await prisma.demand.update({ where: { id }, data: req.body });
    res.json(demand);
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.demand.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
