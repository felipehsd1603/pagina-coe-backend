import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';

const MOCK_PASSWORDS: Record<string, string> = {
  'admin@aegea.mock': 'AegeaAdmin2025!',
  'editor@aegea.mock': 'AegeaEditor2025!',
  'viewer@aegea.mock': 'AegeaViewer2025!',
};

export async function mockLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha sao obrigatorios' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Generic message to prevent user enumeration
      res.status(401).json({ error: 'Credenciais invalidas' });
      return;
    }

    // In mock mode, validate against known mock passwords
    if (env.AUTH_MODE === 'mock') {
      const expectedPassword = MOCK_PASSWORDS[email];
      if (!expectedPassword || password !== expectedPassword) {
        console.warn(`[auth] Login falhou para ${email} - senha incorreta`);
        res.status(401).json({ error: 'Credenciais invalidas' });
        return;
      }
    }

    // Sign a proper JWT with expiration
    const token = jwt.sign(
      {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: env.AUTH_MODE === 'mock' ? 'portal-aegea-mock' : 'portal-aegea',
      }
    );

    console.log(`[auth] Login bem-sucedido: ${user.email} (role: ${user.role})`);

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
      select: { id: true, email: true, name: true, role: true },
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
