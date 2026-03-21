import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function adminListUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuarios' });
  }
}

export async function adminCreateUser(req: Request, res: Response) {
  try {
    const { email, name, role, entraId } = req.body;

    if (!email || !name) {
      res.status(400).json({ error: 'Email e nome sao obrigatorios' });
      return;
    }

    const validRoles = ['VIEWER', 'EDITOR', 'ADMIN'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: `Role invalida. Use: ${validRoles.join(', ')}` });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Ja existe um usuario com este email' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'VIEWER',
        entraId: entraId || `manual-${Date.now()}`,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuario' });
  }
}

export async function adminUpdateUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { name, role } = req.body;

    const validRoles = ['VIEWER', 'EDITOR', 'ADMIN'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: `Role invalida. Use: ${validRoles.join(', ')}` });
      return;
    }

    // Prevent removing the last admin
    if (role && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      const currentUser = await prisma.user.findUnique({ where: { id } });
      if (adminCount <= 1 && currentUser?.role === 'ADMIN') {
        res.status(400).json({ error: 'Nao e possivel remover o ultimo administrador' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuario' });
  }
}

export async function adminDeleteUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    // Prevent self-deletion
    if (req.user?.id === id) {
      res.status(400).json({ error: 'Voce nao pode deletar sua propria conta' });
      return;
    }

    // Prevent removing the last admin
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        res.status(400).json({ error: 'Nao e possivel remover o ultimo administrador' });
        return;
      }
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuario' });
  }
}
