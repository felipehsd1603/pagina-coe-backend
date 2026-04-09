import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const createUserSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(200),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
  entraId: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).optional(),
  department: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
});

const userSelectFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  department: true,
  jobTitle: true,
  createdAt: true,
} as const;

export async function adminListUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: userSelectFields,
        skip,
        take: limit,
      }),
      prisma.user.count(),
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

export async function adminCreateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: 'Ja existe um usuario com este email' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        entraId: data.entraId || `manual-${Date.now()}`,
        department: data.department,
        jobTitle: data.jobTitle,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      select: userSelectFields,
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminUpdateUser(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Prevent removing the last admin
    if (data.role && data.role !== 'ADMIN') {
      const currentUser = await prisma.user.findUnique({ where: { id } });
      if (currentUser?.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
        if (adminCount <= 1) {
          res.status(400).json({ error: 'Nao e possivel remover o ultimo administrador' });
          return;
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelectFields,
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    next(error);
  }
}

export async function adminDeleteUser(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const hard = req.query.hard === 'true';

    if (req.user?.id === id) {
      res.status(400).json({ error: 'Voce nao pode desativar/deletar sua propria conta' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario nao encontrado' });
      return;
    }

    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (adminCount <= 1) {
        res.status(400).json({ error: 'Nao e possivel remover o ultimo administrador' });
        return;
      }
    }

    if (hard) {
      // Hard delete — permanently removes the user
      await prisma.user.delete({ where: { id } });
      res.status(204).send();
    } else {
      // Soft delete — sets isActive to false
      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: userSelectFields,
      });
      res.json(updated);
    }
  } catch (error) {
    next(error);
  }
}

export async function toggleUserActive(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Cannot deactivate yourself
    if (req.user?.id === id) {
      res.status(400).json({ error: 'Voce nao pode desativar sua propria conta' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario nao encontrado' });
      return;
    }

    // If trying to deactivate an admin, check it's not the last one
    if (user.isActive && user.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (activeAdminCount <= 1) {
        res.status(400).json({ error: 'Nao e possivel desativar o ultimo administrador' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: userSelectFields,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}
