import pino from 'pino';

/**
 * Structured logger for the portal backend.
 * - Development: pretty-printed for readability
 * - Production: JSON for log aggregation (ELK, Azure Monitor, etc.)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
});
