import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  DATABASE_URL: z.string().default(''),
  AUTH_MODE: z.enum(['mock', 'entra']).default('mock'),
  MOCK_JWT_SECRET: z.string().default('empresa-mock-secret-dev-only'),
  // CoE Data Source: "dataverse" (real API), "local" (AEGEA telemetria), "mock" (demo)
  COE_DATA_SOURCE: z.enum(['dataverse', 'local', 'mock']).default('local'),
  // Dataverse OData (required when COE_DATA_SOURCE=dataverse)
  DATAVERSE_URL: z.string().optional(),
  DATAVERSE_TENANT_ID: z.string().optional(),
  DATAVERSE_CLIENT_ID: z.string().optional(),
  DATAVERSE_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variaveis de ambiente invalidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
