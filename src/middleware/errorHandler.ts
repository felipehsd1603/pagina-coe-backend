import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  console.error(`[erro] ${status} - ${message}`, err.stack);

  res.status(status).json({
    error: message,
    status,
  });
}
