import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  DATABASE_URL: z.string().default(''),
  AUTH_MODE: z.enum(['mock', 'entra']).default('mock'),
  MOCK_JWT_SECRET: z.string().default('aegea-mock-secret-dev-only'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variaveis de ambiente invalidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
