import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default(''),
  AUTH_MODE: z.enum(['mock', 'entra']).default('mock'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  // CORS: comma-separated allowed origins
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  // CoE Data Source: "dataverse" (real API), "local" (AEGEA telemetria), "mock" (demo)
  COE_DATA_SOURCE: z.enum(['dataverse', 'local', 'mock']).default('local'),
  // Dataverse OData (required when COE_DATA_SOURCE=dataverse)
  DATAVERSE_URL: z.string().optional(),
  DATAVERSE_TENANT_ID: z.string().optional(),
  DATAVERSE_CLIENT_ID: z.string().optional(),
  DATAVERSE_CLIENT_SECRET: z.string().optional(),
  // Mock credentials (only used when AUTH_MODE=mock, must be set via .env)
  MOCK_ADMIN_PASSWORD: z.string().optional(),
  MOCK_EDITOR_PASSWORD: z.string().optional(),
  MOCK_VIEWER_PASSWORD: z.string().optional(),
  // Entra ID (Microsoft Graph) — for user sync from AD group
  ENTRA_TENANT_ID: z.string().optional(),
  ENTRA_CLIENT_ID: z.string().optional(),
  ENTRA_CLIENT_SECRET: z.string().optional(),
  ENTRA_GROUP_ID: z.string().optional(),
  // Redis — shared state across pods (token blacklist, etc.)
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variaveis de ambiente invalidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// SECURITY: Block mock auth in production
if (parsed.data.NODE_ENV === 'production' && parsed.data.AUTH_MODE === 'mock') {
  console.error('[SECURITY] AUTH_MODE=mock nao e permitido em NODE_ENV=production. Use AUTH_MODE=entra.');
  process.exit(1);
}

export const env = parsed.data;
