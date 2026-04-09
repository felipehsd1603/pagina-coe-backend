import { logger } from '../config/logger';
import prisma from '../config/database';
import { env } from '../config/env';

interface GraphUser {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  department: string | null;
  jobTitle: string | null;
}

interface GraphMembersResponse {
  value: GraphUser[];
  '@odata.nextLink'?: string;
}

interface SyncResult {
  created: number;
  updated: number;
  deactivated: number;
  errors: string[];
}

/**
 * Validates that all required Entra ID env vars are set.
 * Returns null if valid, or an error message if not.
 */
function validateEntraConfig(): string | null {
  const required = ['ENTRA_TENANT_ID', 'ENTRA_CLIENT_ID', 'ENTRA_CLIENT_SECRET', 'ENTRA_GROUP_ID'] as const;
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    return `Variaveis de ambiente ausentes para integracao Entra ID: ${missing.join(', ')}. Configure no arquivo .env do backend.`;
  }
  return null;
}

/**
 * Obtains an OAuth2 client_credentials token from Microsoft Entra ID.
 */
async function getGraphToken(): Promise<string> {
  const tenantId = env.ENTRA_TENANT_ID!;
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: env.ENTRA_CLIENT_ID!,
    client_secret: env.ENTRA_CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao obter token do Entra ID: ${response.status} — ${text}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Fetches all members of the configured AD group via Microsoft Graph API.
 * Handles pagination via @odata.nextLink.
 */
async function getGroupMembers(token: string): Promise<GraphUser[]> {
  const groupId = env.ENTRA_GROUP_ID!;
  let url: string | undefined = `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,mail,userPrincipalName,department,jobTitle&$top=999`;
  const allMembers: GraphUser[] = [];

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Falha ao listar membros do grupo AD: ${response.status} — ${text}`);
    }

    const data = (await response.json()) as GraphMembersResponse;
    // Filter to only user objects (skip groups, service principals, etc.)
    const users = data.value.filter(
      (m: GraphUser & { '@odata.type'?: string }) =>
        (m as GraphUser & { '@odata.type'?: string })['@odata.type'] === '#microsoft.graph.user' ||
        m.userPrincipalName != null
    );
    allMembers.push(...users);
    url = data['@odata.nextLink'];
  }

  return allMembers;
}

/**
 * Synchronizes portal users with a Microsoft Entra ID (Azure AD) group.
 *
 * Logic:
 * - For each AD user: if not in portal, create with role VIEWER.
 *   If already exists, update name, department, jobTitle.
 * - Users in the portal that are NOT in the AD group are marked isActive=false.
 */
export async function syncEntraUsers(): Promise<SyncResult> {
  const configError = validateEntraConfig();
  if (configError) {
    throw new Error(configError);
  }

  const token = await getGraphToken();
  const adMembers = await getGroupMembers(token);

  const result: SyncResult = { created: 0, updated: 0, deactivated: 0, errors: [] };

  // Build a set of AD entraIds for deactivation check
  const adEntraIds = new Set(adMembers.map((m) => m.id));

  // Upsert each AD member
  for (const member of adMembers) {
    const email = member.mail || member.userPrincipalName;
    if (!email) {
      result.errors.push(`Membro AD ${member.id} (${member.displayName}) sem email — ignorado`);
      continue;
    }

    try {
      const existing = await prisma.user.findUnique({ where: { entraId: member.id } });

      if (existing) {
        // Update existing user
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: member.displayName,
            email,
            department: member.department,
            jobTitle: member.jobTitle,
            isActive: true, // Re-activate if they are back in the group
          },
        });
        result.updated++;
      } else {
        // Check if email already exists (manual user)
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail) {
          // Link existing manual user to Entra ID
          await prisma.user.update({
            where: { id: byEmail.id },
            data: {
              entraId: member.id,
              name: member.displayName,
              department: member.department,
              jobTitle: member.jobTitle,
              isActive: true,
            },
          });
          result.updated++;
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              entraId: member.id,
              email,
              name: member.displayName,
              role: 'VIEWER',
              department: member.department,
              jobTitle: member.jobTitle,
              isActive: true,
            },
          });
          result.created++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Erro ao sincronizar ${email}: ${msg}`);
    }
  }

  // Deactivate portal users whose entraId is NOT in the AD group
  // Only deactivate users that were synced from Entra (entraId does not start with "manual-")
  try {
    const portalUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: { entraId: { startsWith: 'manual-' } },
      },
      select: { id: true, entraId: true, role: true },
    });

    for (const pu of portalUsers) {
      if (!adEntraIds.has(pu.entraId)) {
        // Don't deactivate the last admin
        if (pu.role === 'ADMIN') {
          const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
          if (activeAdminCount <= 1) {
            result.errors.push(`Admin ${pu.id} removido do grupo AD mas mantido ativo (ultimo admin)`);
            continue;
          }
        }
        await prisma.user.update({
          where: { id: pu.id },
          data: { isActive: false },
        });
        result.deactivated++;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Erro na desativacao de usuarios removidos: ${msg}`);
  }

  logger.info({ created: result.created, updated: result.updated, deactivated: result.deactivated }, 'Entra ID sync completed');
  return result;
}
