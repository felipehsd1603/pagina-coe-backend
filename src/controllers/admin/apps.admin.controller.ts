import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const appUpdateSchema = z.object({
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  bannerUrl: z.string().url().max(500).optional().nullable(),
  iconUrl: z.string().url().max(500).optional().nullable(),
  published: z.boolean().optional(),
});

export async function adminListApps(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apps = await prisma.app.findMany({
      orderBy: { name: 'asc' },
      include: { benefits: true, metrics: true },
    });
    res.json(apps);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateApp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = appUpdateSchema.parse(req.body);

    const app = await prisma.app.update({
      where: { id },
      data,
      include: { benefits: true, documents: true, metrics: true, relatedFlows: true },
    });

    res.json(app);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminDeleteApp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.app.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
