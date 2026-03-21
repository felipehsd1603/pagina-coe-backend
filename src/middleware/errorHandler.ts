import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || 500;

  // Log full error internally
  console.error(`[erro] ${status} - ${err.message}`, err.stack);

  // Never expose internal details to the client
  const isProduction = process.env.NODE_ENV === 'production';
  const message =
    isProduction && status === 500
      ? 'Erro interno do servidor'
      : err.message || 'Erro interno do servidor';

  res.status(status).json({
    error: message,
  });
}
