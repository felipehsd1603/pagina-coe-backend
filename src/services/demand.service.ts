import { z } from 'zod';
import prisma from '../config/database';

// ─── Validation Schemas ──────────────────────────────────

export const createDemandSchema = z.object({
  title: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descricao deve ter pelo menos 10 caracteres'),
  requesterName: z.string().min(2),
  requesterEmail: z.string().email('Email invalido'),
  area: z.string().min(2),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  lgpdConsent: z.boolean().refine(val => val === true, { message: 'Consentimento LGPD obrigatorio' }),
});

export const updateDemandSchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  adminNotes: z.string().max(5000).optional().nullable(),
});

export type CreateDemandInput = z.infer<typeof createDemandSchema>;
export type UpdateDemandInput = z.infer<typeof updateDemandSchema>;

// ─── Service Error ──────────────────────────────────────

export class DemandError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'DemandError';
  }
}

// ─── Service Functions ──────────────────────────────────

/**
 * Create a new demand with validated data.
 * When lgpdConsent is true, persists the consent timestamp (LGPD compliance).
 */
export async function createDemand(input: CreateDemandInput) {
  const { lgpdConsent, ...demandData } = input;
  return prisma.demand.create({
    data: {
      ...demandData,
      status: 'PENDING',
      lgpdConsentAt: lgpdConsent ? new Date() : null,
    },
  });
}

/**
 * Delete a demand. Validates ownership (requester or admin).
 */
export async function deleteDemand(
  demandId: string,
  userEmail: string | undefined,
  userRole: string | undefined,
): Promise<void> {
  const demand = await prisma.demand.findUnique({ where: { id: demandId } });

  if (!demand) {
    throw new DemandError('Demanda nao encontrada', 404);
  }

  // LGPD: Allow requester or admin to delete their data
  const isAdmin = userRole === 'ADMIN';
  const isOwner = userEmail === demand.requesterEmail;

  if (!isAdmin && !isOwner) {
    throw new DemandError('Sem permissao para excluir esta demanda', 403);
  }

  await prisma.demand.delete({ where: { id: demandId } });
}

/**
 * List all demands (admin view), ordered by most recent.
 */
export async function listDemands() {
  return prisma.demand.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update a demand (admin: status transitions, notes, priority).
 */
export async function updateDemand(demandId: string, input: UpdateDemandInput) {
  return prisma.demand.update({
    where: { id: demandId },
    data: input,
  });
}

/**
 * Delete a demand by admin (no ownership check).
 */
export async function adminDeleteDemand(demandId: string): Promise<void> {
  await prisma.demand.delete({ where: { id: demandId } });
}
