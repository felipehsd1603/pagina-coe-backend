import { Request, Response, NextFunction } from 'express';
import * as appService from '../services/app.service';

export async function listApps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, phase, search, page, limit } = req.query as Record<string, string | undefined>;
    const isAuthenticated = !!req.user;

    const result = await appService.listApps(
      { category, phase, search, page, limit },
      isAuthenticated,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAppBySlug(req: Request<{ slug: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { slug } = req.params;
    const isAuthenticated = !!req.user;

    const app = await appService.getAppBySlug(slug, isAuthenticated);

    if (!app) {
      res.status(404).json({ error: 'App nao encontrado' });
      return;
    }

    res.json(app);
  } catch (error) {
    next(error);
  }
}
