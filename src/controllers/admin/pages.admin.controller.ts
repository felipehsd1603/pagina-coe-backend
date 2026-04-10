import { Request, Response } from 'express';
import prisma from '../../config/database';

/** GET /api/v1/pages — public, returns only enabled pages/sections */
export async function listEnabledPages(req: Request, res: Response) {
  const items = await prisma.pageVisibility.findMany({
    where: { isEnabled: true },
    select: { slug: true, label: true, type: true, parentSlug: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(items);
}

/** GET /api/v1/admin/pages — ADMIN: returns all pages with enabled state */
export async function adminListPages(req: Request, res: Response) {
  const items = await prisma.pageVisibility.findMany({
    orderBy: [{ parentSlug: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(items);
}

/** PUT /api/v1/admin/pages/:id — toggle enabled state */
export async function adminTogglePage(req: Request, res: Response) {
  const id = req.params['id'] as string;
  const { enabled } = req.body as { enabled: boolean };

  if (typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'Campo enabled (boolean) é obrigatório.' });
    return;
  }

  const existing = await prisma.pageVisibility.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Registro não encontrado.' });
    return;
  }

  // If disabling a PAGE, cascade to child SECTIONs
  if (existing.type === 'PAGE' && !enabled) {
    await prisma.pageVisibility.updateMany({
      where: { parentSlug: existing.slug },
      data: { isEnabled: false },
    });
  }

  await prisma.pageVisibility.update({
    where: { id },
    data: { isEnabled: enabled },
  });

  // Return full list so UI can refresh in one shot
  const all = await prisma.pageVisibility.findMany({
    orderBy: [{ parentSlug: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(all);
}
