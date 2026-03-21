/**
 * CoE Sync Service
 *
 * Sincroniza dados do CoE Starter Kit (Dataverse) para o banco local do portal.
 *
 * Em PRODUCAO:
 *   1. Auth via Entra ID (client_credentials) com scope Dataverse
 *   2. Fetch OData das tabelas admin_apps, admin_flows, admin_makers, admin_environments
 *   3. Map para o schema do portal
 *   4. Upsert no Azure SQL via Prisma
 *
 * Em MOCK:
 *   Retorna dados do coe-mock-data.ts simulando a resposta do Dataverse.
 */

import {
  MOCK_COE_APPS, MOCK_COE_FLOWS, MOCK_COE_MAKERS,
  MOCK_COE_ENVIRONMENTS, MOCK_COE_CONNECTORS,
  type CoeApp, type CoeFlow, type CoeMaker,
  type CoeEnvironment, type CoeConnectorUsage,
} from './coe-mock-data';

// ─── Types for sync results ────────────────────────────

export interface SyncResult {
  source: string;
  recordsFound: number;
  recordsSynced: number;
  errors: string[];
  syncedAt: string;
}

export interface CoeSyncSummary {
  status: 'success' | 'partial' | 'error';
  duration: number;
  results: SyncResult[];
  computedMetrics: ComputedMetrics;
}

export interface ComputedMetrics {
  totalApps: number;
  totalFlows: number;
  totalMakers: number;
  totalEnvironments: number;
  premiumConnectorsCount: number;
  activeAppsLast30Days: number;
  topRegionals: { name: string; appsCount: number }[];
  connectorsByTier: { standard: number; premium: number; custom: number };
}

// ─── Dataverse Client (mock/real) ───────────────────────

interface DataverseClient {
  fetchApps(): Promise<CoeApp[]>;
  fetchFlows(): Promise<CoeFlow[]>;
  fetchMakers(): Promise<CoeMaker[]>;
  fetchEnvironments(): Promise<CoeEnvironment[]>;
  fetchConnectors(): Promise<CoeConnectorUsage[]>;
}

/**
 * Mock client — retorna dados estaticos.
 * Substituir por DataverseODataClient em producao.
 */
class MockDataverseClient implements DataverseClient {
  async fetchApps() { return MOCK_COE_APPS; }
  async fetchFlows() { return MOCK_COE_FLOWS; }
  async fetchMakers() { return MOCK_COE_MAKERS; }
  async fetchEnvironments() { return MOCK_COE_ENVIRONMENTS; }
  async fetchConnectors() { return MOCK_COE_CONNECTORS; }
}

/**
 * Producao client — usa OData + Entra ID.
 *
 * Para ativar, defina as env vars:
 *   DATAVERSE_URL=https://{org}.crm2.dynamics.com
 *   DATAVERSE_CLIENT_ID=...
 *   DATAVERSE_CLIENT_SECRET=...
 *   DATAVERSE_TENANT_ID=...
 *
 * Exemplo de chamada OData:
 *   GET {DATAVERSE_URL}/api/data/v9.2/admin_apps
 *     ?$select=admin_appid,admin_displayname,admin_appowner,...
 *     &$filter=admin_appenvironment eq 'Producao - Empresa Ficticia Saneamento'
 *     &$top=500
 *   Authorization: Bearer {access_token}
 */
// class DataverseODataClient implements DataverseClient {
//   private baseUrl: string;
//   private token: string = '';
//
//   constructor() {
//     this.baseUrl = process.env.DATAVERSE_URL || '';
//   }
//
//   private async authenticate(): Promise<string> {
//     const tenantId = process.env.DATAVERSE_TENANT_ID;
//     const res = await fetch(
//       `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//         body: new URLSearchParams({
//           grant_type: 'client_credentials',
//           client_id: process.env.DATAVERSE_CLIENT_ID || '',
//           client_secret: process.env.DATAVERSE_CLIENT_SECRET || '',
//           scope: `${this.baseUrl}/.default`,
//         }),
//       }
//     );
//     const data = await res.json();
//     this.token = data.access_token;
//     return this.token;
//   }
//
//   private async odata<T>(entity: string, select?: string): Promise<T[]> {
//     if (!this.token) await this.authenticate();
//     const url = `${this.baseUrl}/api/data/v9.2/${entity}${select ? `?$select=${select}` : ''}`;
//     const res = await fetch(url, {
//       headers: { Authorization: `Bearer ${this.token}`, 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' },
//     });
//     const json = await res.json();
//     return json.value as T[];
//   }
//
//   async fetchApps() { return this.odata<CoeApp>('admin_apps'); }
//   async fetchFlows() { return this.odata<CoeFlow>('admin_flows'); }
//   async fetchMakers() { return this.odata<CoeMaker>('admin_makers'); }
//   async fetchEnvironments() { return this.odata<CoeEnvironment>('admin_environments'); }
//   async fetchConnectors() { return this.odata<CoeConnectorUsage>('admin_connectorusage'); }
// }

// ─── Sync Service ───────────────────────────────────────

function getClient(): DataverseClient {
  // Em producao: verificar env vars e retornar DataverseODataClient
  // if (process.env.DATAVERSE_URL) return new DataverseODataClient();
  return new MockDataverseClient();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function inferCategory(app: CoeApp): string {
  const name = app.admin_displayname.toLowerCase();
  const dept = app.admin_appregional.toLowerCase();

  if (name.includes('compra') || name.includes('inadimplencia') || name.includes('financ')) return 'FINANCEIRO';
  if (name.includes('colaborador') || name.includes('rh') || name.includes('epi')) return 'CORPORATIVO';
  if (name.includes('obra') || name.includes('rede') || name.includes('inspecao')) return 'ENGENHARIA';
  if (name.includes('qualidade') || name.includes('tratamento') || name.includes('eta')) return 'OPERACIONAL';
  if (name.includes('frota') || name.includes('logistic')) return 'OPERACIONAL';
  if (name.includes('leitura') || name.includes('hidrometro')) return 'OPERACIONAL';
  if (dept.includes('corporativo')) return 'CORPORATIVO';
  return 'OPERACIONAL';
}

function computeMetrics(
  apps: CoeApp[],
  flows: CoeFlow[],
  makers: CoeMaker[],
  environments: CoeEnvironment[],
  connectors: CoeConnectorUsage[],
): ComputedMetrics {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeApps = apps.filter(a => new Date(a.admin_lastlauncheddate) >= thirtyDaysAgo);

  // Top regionais
  const regionalMap = new Map<string, number>();
  for (const app of apps) {
    const r = app.admin_appregional;
    regionalMap.set(r, (regionalMap.get(r) || 0) + 1);
  }
  const topRegionals = [...regionalMap.entries()]
    .map(([name, appsCount]) => ({ name, appsCount }))
    .sort((a, b) => b.appsCount - a.appsCount)
    .slice(0, 5);

  // Connectors by tier
  const connectorsByTier = { standard: 0, premium: 0, custom: 0 };
  for (const c of connectors) {
    if (c.tier === 'Standard') connectorsByTier.standard++;
    else if (c.tier === 'Premium') connectorsByTier.premium++;
    else connectorsByTier.custom++;
  }

  return {
    totalApps: apps.length,
    totalFlows: flows.length,
    totalMakers: makers.length,
    totalEnvironments: environments.length,
    premiumConnectorsCount: connectors.filter(c => c.tier === 'Premium').length,
    activeAppsLast30Days: activeApps.length,
    topRegionals,
    connectorsByTier,
  };
}

// ─── Main sync function ─────────────────────────────────

export async function syncFromCoE(): Promise<CoeSyncSummary> {
  const start = Date.now();
  const client = getClient();
  const results: SyncResult[] = [];

  // 1. Fetch all data from CoE
  const [apps, flows, makers, environments, connectors] = await Promise.all([
    client.fetchApps(),
    client.fetchFlows(),
    client.fetchMakers(),
    client.fetchEnvironments(),
    client.fetchConnectors(),
  ]);

  // 2. Sync Apps
  results.push({
    source: 'admin_apps',
    recordsFound: apps.length,
    recordsSynced: apps.length,
    errors: [],
    syncedAt: new Date().toISOString(),
  });

  // 3. Sync Flows
  results.push({
    source: 'admin_flows',
    recordsFound: flows.length,
    recordsSynced: flows.length,
    errors: [],
    syncedAt: new Date().toISOString(),
  });

  // 4. Sync Makers
  results.push({
    source: 'admin_makers',
    recordsFound: makers.length,
    recordsSynced: makers.length,
    errors: [],
    syncedAt: new Date().toISOString(),
  });

  // 5. Sync Environments
  results.push({
    source: 'admin_environments',
    recordsFound: environments.length,
    recordsSynced: environments.length,
    errors: [],
    syncedAt: new Date().toISOString(),
  });

  // 6. Compute metrics from CoE data
  const computedMetrics = computeMetrics(apps, flows, makers, environments, connectors);

  const hasErrors = results.some(r => r.errors.length > 0);

  return {
    status: hasErrors ? 'partial' : 'success',
    duration: Date.now() - start,
    results,
    computedMetrics,
  };
}

// ─── Individual getters (for API endpoints) ─────────────

export async function getCoeApps() {
  const client = getClient();
  const apps = await client.fetchApps();
  return apps.map(app => ({
    coeId: app.admin_appid,
    name: app.admin_displayname,
    slug: slugify(app.admin_displayname),
    environment: app.admin_appenvironment,
    owner: app.admin_appowner,
    ownerEmail: app.admin_appowneremail,
    appType: app.admin_apptype,
    regional: app.admin_appregional,
    category: inferCategory(app),
    lastLaunched: app.admin_lastlauncheddate,
    usersCount: app.admin_shareduserscount,
    sessionsMonth: app.admin_sessioncount,
    connectors: JSON.parse(app.admin_connectors) as string[],
    createdAt: app.admin_createdon,
    updatedAt: app.admin_modifiedon,
  }));
}

export async function getCoeFlows() {
  const client = getClient();
  const flows = await client.fetchFlows();
  return flows.map(f => ({
    coeId: f.admin_flowid,
    name: f.admin_displayname,
    environment: f.admin_flowenvironment,
    owner: f.admin_flowowner,
    state: f.admin_flowstate,
    type: f.admin_flowtype,
    trigger: f.admin_triggertype,
    connectors: JSON.parse(f.admin_connectors) as string[],
    parentAppId: f.admin_parentappid || null,
    createdAt: f.admin_createdon,
    updatedAt: f.admin_modifiedon,
  }));
}

export async function getCoeMakers() {
  const client = getClient();
  return client.fetchMakers();
}

export async function getCoeEnvironments() {
  const client = getClient();
  return client.fetchEnvironments();
}

export async function getCoeConnectors() {
  const client = getClient();
  return client.fetchConnectors();
}
