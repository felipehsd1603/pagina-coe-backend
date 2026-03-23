import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  listDemands,
  updateDemand,
  updateDemandSchema,
  adminDeleteDemand as adminDeleteDemandService,
} from '../../services/demand.service';

export async function adminListDemands(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const demands = await listDemands();
    res.json(demands);
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
