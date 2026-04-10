import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { routes } from './routes';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { auditMiddleware } from './middleware/auditMiddleware';
import { healthRouter } from './routes/health.routes';
import prisma from './config/database';
import { tokenBlacklist } from './middleware/authMiddleware';
import { redis, connectRedis } from './config/redis';

const app = express();

// ─── Request logging (pino-http) ───────────────────
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => ['/healthz', '/readyz'].includes((req as express.Request).path) } }));

// ─── Security headers (Helmet) ──────────────────────
app.use(helmet());

// ─── CORS with explicit origins ─────────────────────
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin, allowedOrigins }, 'CORS blocked request');
        callback(new Error(`Origin ${origin} nao permitida pelo CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── CSRF protection: Origin/Referer check for mutating requests ───
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (origin && !allowedOrigins.includes(origin)) {
      res.status(403).json({ error: 'Origem nao permitida (CSRF check)' });
      return;
    }
    if (!origin && referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (!allowedOrigins.includes(refererOrigin)) {
          res.status(403).json({ error: 'Referer nao permitido (CSRF check)' });
          return;
        }
      } catch {
        // Invalid referer URL — let it through (will fail on CORS anyway)
      }
    }
  }
  next();
});

// ─── Body size limit ────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Rate limiting ──────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisicoes, tente novamente em 15 minutos' },
});
app.use('/api/', globalLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login, tente novamente em 15 minutos' },
});
app.use('/api/v1/auth/login', authLimiter);

// ─── Audit logging for admin actions ────────────────
app.use('/api/v1/admin', auditMiddleware);

// ─── Swagger docs (development only — not staging) ──
if (env.NODE_ENV === 'development') {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Portal AEGEA - API Docs',
    })
  );
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

// ─── Health probes (no auth) ────────────────────────
app.use(healthRouter);

// ─── Routes ─────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Error handler ──────────────────────────────────
app.use(errorHandler);

const PORT = env.PORT;

async function bootstrap() {
  // Connect Redis (non-blocking — app works without it)
  await connectRedis();

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT, env: env.NODE_ENV }, 'Server started');
    if (env.NODE_ENV === 'development') {
      logger.info({ url: `http://localhost:${PORT}/api/docs` }, 'Swagger docs available');
    }
  });

  // ─── Graceful shutdown ─────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await Promise.all([
        prisma.$disconnect(),
        redis.quit().catch(() => { /* already closed */ }),
      ]);
      tokenBlacklist.destroy();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });
    // Force exit after 10s if connections don't drain
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

void bootstrap();

export default app;
