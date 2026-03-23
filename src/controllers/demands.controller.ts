import { Request, Response, NextFunction } from 'express';
import {
  createDemandSchema,
  createDemand as createDemandService,
  deleteDemand as deleteDemandService,
  DemandError,
} from '../services/demand.service';

export async function createDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createDemandSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const demand = await createDemandService(parsed.data);
    res.status(201).json(demand);
  } catch (error) {
    next(error);
  }
}

export async function deleteDemand(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    await deleteDemandService(id, req.user?.email, req.user?.role);
    res.status(204).send();
  } catch (error) {
    if (error instanceof DemandError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}
