import { Request, Response, NextFunction } from 'express';
import { login, invalidateToken, getProfile, AuthError } from '../services/auth.service';
import { getFeaturesForRole } from '../config/features';

export async function mockLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha sao obrigatorios' });
      return;
    }

    const result = await login(email, password);

    // Include features in login response
    res.json({
      ...result,
      features: getFeaturesForRole(result.user.role),
    });
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
    await invalidateToken(req.headers.authorization);
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

    // Include features based on user role in /auth/me response
    res.json({
      ...user,
      features: getFeaturesForRole(user.role),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}
