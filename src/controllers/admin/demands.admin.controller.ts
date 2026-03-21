import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const demandUpdateSchema = z.object({
  status: z.enum(['NOVA', 'EM_ANALISE', 'APROVADA', 'EM_DESENVOLVIMENTO', 'CONCLUIDA', 'REJEITADA']).optional(),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']).optional(),
  notes: z.string().max(5000).optional().nullable(),
  assignedTo: z.string().max(200).optional().nullable(),
});

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
    const data = demandUpdateSchema.parse(req.body);
    const demand = await prisma.demand.update({ where: { id }, data });
    res.json(demand);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
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
