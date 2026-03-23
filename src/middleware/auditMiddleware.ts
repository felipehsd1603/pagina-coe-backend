import { Request, Response, NextFunction } from 'express';

/**
 * Audit logging middleware for admin actions.
 * Logs structured JSON for mutating operations on admin endpoints.
 * SECURITY: Provides audit trail for administrative operations.
 * NOTE: For production, consider forwarding to a centralized logging system (ELK, Azure Monitor).
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: `${req.method} ${req.originalUrl}`,
      userId: req.user?.id || 'unauthenticated',
      userRole: req.user?.role || 'unknown',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    };
    console.log(`[audit] ${JSON.stringify(auditEntry)}`);
  }
  next();
}
