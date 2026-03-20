import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function mockLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha sao obrigatorios' });
      return;
    }

    // Mock authentication: find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Credenciais invalidas' });
      return;
    }

    // In mock mode, any password works. Generate a base64 token.
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Nao autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, entraId: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario nao encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}
