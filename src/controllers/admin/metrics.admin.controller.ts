import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const metricSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/, 'Key deve conter apenas letras minusculas, numeros, hifens e underscores'),
  label: z.string().min(1).max(200),
  value: z.string().max(100),
  icon: z.string().max(50).optional().nullable(),
});

export async function adminListMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.globalMetric.findMany({
        orderBy: { key: 'asc' },
        skip,
        take: limit,
      }),
      prisma.globalMetric.count(),
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

export async function adminDeleteMetric(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.globalMetric.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
