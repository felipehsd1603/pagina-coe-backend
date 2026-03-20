import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

const createDemandSchema = z.object({
  title: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descricao deve ter pelo menos 10 caracteres'),
  requesterName: z.string().min(2),
  requesterEmail: z.string().email('Email invalido'),
  area: z.string().min(2),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

export async function createDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createDemandSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const demand = await prisma.demand.create({
      data: {
        ...parsed.data,
        status: 'PENDING',
      },
    });

    res.status(201).json(demand);
  } catch (error) {
    next(error);
  }
}
