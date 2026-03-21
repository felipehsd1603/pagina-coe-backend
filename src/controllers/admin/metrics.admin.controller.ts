import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const metricSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/, 'Key deve conter apenas letras minusculas, numeros, hifens e underscores'),
  label: z.string().min(1).max(200),
  value: z.string().max(100),
  icon: z.string().max(50).optional().nullable(),
});

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
    const data = metricSchema.parse(req.body);

    const metric = await prisma.globalMetric.upsert({
      where: { key: data.key },
      update: { label: data.label, value: data.value, icon: data.icon },
      create: data,
    });

    res.json(metric);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
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
