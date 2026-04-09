import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Audit logging middleware for admin actions.
 * Logs structured JSON for mutating operations on admin endpoints.
 * SECURITY: Provides audit trail for administrative operations.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    logger.info({
      audit: true,
      action: `${req.method} ${req.originalUrl}`,
      userId: req.user?.id || 'unauthenticated',
      userRole: req.user?.role || 'unknown',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    }, 'Admin action');
  }
  next();
}
