import prisma from '../config/database';

// LGPD: Strip ownerEmail from app objects for unauthenticated requests
function stripPII<T extends Record<string, unknown>>(obj: T): Omit<T, 'ownerEmail'> {
  const { ownerEmail: _ownerEmail, ...rest } = obj;
  return rest as Omit<T, 'ownerEmail'>;
}

export interface ListAppsParams {
  category?: string;
  phase?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List apps with pagination, filtering, and optional PII stripping.
 */
export async function listApps(
  params: ListAppsParams,
  isAuthenticated: boolean,
): Promise<PaginatedResult<Record<string, unknown>>> {
  const { category, phase, search, page = '1', limit = '12' } = params;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (category && typeof category === 'string') {
    where.category = category;
  }
  if (phase && typeof phase === 'string') {
    where.phase = phase;
  }
  if (search && typeof search === 'string') {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [apps, total] = await Promise.all([
    prisma.app.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' },
      include: {
        benefits: true,
        metrics: true,
      },
    }),
    prisma.app.count({ where }),
  ]);

  // LGPD: Strip ownerEmail for unauthenticated (public) requests
  const safeApps = isAuthenticated ? apps : apps.map(stripPII);

  return {
    data: safeApps as Record<string, unknown>[],
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Get a single app by slug, with optional PII stripping.
 */
export async function getAppBySlug(slug: string, isAuthenticated: boolean) {
  const app = await prisma.app.findUnique({
    where: { slug },
    include: {
      benefits: true,
      documents: true,
      metrics: true,
      relatedFlows: true,
      testimonials: true,
    },
  });

  if (!app) {
    return null;
  }

  return isAuthenticated ? app : stripPII(app as Record<string, unknown>);
}
