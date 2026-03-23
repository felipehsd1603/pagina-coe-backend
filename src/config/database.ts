import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // SECURITY: 'query' log level removed even in development to avoid logging
  // sensitive data (user emails, tokens, etc.) via Prisma query strings.
  // Use 'query' level only for targeted debugging and never in shared environments.
  log: ['warn', 'error'],
});

export default prisma;
