import { Request, Response, NextFunction } from 'express';
import { login, invalidateToken, getProfile, AuthError } from '../services/auth.service';

export async function mockLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha sao obrigatorios' });
      return;
    }

    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    invalidateToken(req.headers.authorization);
    res.json({ message: 'Logout realizado com sucesso' });
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

    const user = await getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}
