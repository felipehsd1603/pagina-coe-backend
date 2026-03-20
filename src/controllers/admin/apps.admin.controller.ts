import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

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

export async function adminCreateApp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { benefits, documents, metrics, relatedFlows, ...appData } = req.body;

    const app = await prisma.app.create({
      data: {
        ...appData,
        benefits: benefits ? { create: benefits } : undefined,
        documents: documents ? { create: documents } : undefined,
        metrics: metrics ? { create: metrics } : undefined,
        relatedFlows: relatedFlows ? { create: relatedFlows } : undefined,
      },
      include: { benefits: true, documents: true, metrics: true, relatedFlows: true },
    });

    res.status(201).json(app);
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateApp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { benefits, documents, metrics, relatedFlows, ...appData } = req.body;

    const app = await prisma.app.update({
      where: { id },
      data: appData,
      include: { benefits: true, documents: true, metrics: true, relatedFlows: true },
    });

    res.json(app);
  } catch (error) {
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
