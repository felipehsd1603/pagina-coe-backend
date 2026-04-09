import { logger } from '../config/logger';
/**
 * CoE Sync Service
 *
 * Sincroniza dados do CoE Starter Kit (Dataverse) para o portal.
 *
 * Modos de operacao (COE_DATA_SOURCE):
 *   "dataverse" — Conecta ao Dataverse via OData + Entra ID (client_credentials)
 *   "local"     — Usa dados reais da AEGEA (telemetria JSON + fichas parseadas)
 *   "mock"      — Dados ficticios para demo (fallback padrao)
 */

import {
  MOCK_COE_APPS, MOCK_COE_FLOWS, MOCK_COE_MAKERS,
  MOCK_COE_ENVIRONMENTS, MOCK_COE_CONNECTORS,
  type CoeApp, type CoeFlow, type CoeMaker,
  type CoeEnvironment, type CoeConnectorUsage,
} from './coe-mock-data';

import { AEGEA_COE_APPS, AEGEA_COE_FLOWS, AEGEA_COE_MAKERS, AEGEA_COE_ENVIRONMENTS, AEGEA_COE_CONNECTORS } from './aegea-real-data';

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

// ─── Dataverse Client Interface ─────────────────────────

interface DataverseClient {
  fetchApps(): Promise<CoeApp[]>;
  fetchFlows(): Promise<CoeFlow[]>;
  fetchMakers(): Promise<CoeMaker[]>;
  fetchEnvironments(): Promise<CoeEnvironment[]>;
  fetchConnectors(): Promise<CoeConnectorUsage[]>;
}

// ─── Mock client (dados ficticios) ──────────────────────

class MockDataverseClient implements DataverseClient {
  async fetchApps() { return MOCK_COE_APPS; }
  async fetchFlows() { return MOCK_COE_FLOWS; }
  async fetchMakers() { return MOCK_COE_MAKERS; }
  async fetchEnvironments() { return MOCK_COE_ENVIRONMENTS; }
  async fetchConnectors() { return MOCK_COE_CONNECTORS; }
}

// ─── Local client (dados reais AEGEA da telemetria) ─────

class LocalAegeaClient implements DataverseClient {
  async fetchApps() { return AEGEA_COE_APPS; }
  async fetchFlows() { return AEGEA_COE_FLOWS; }
  async fetchMakers() { return AEGEA_COE_MAKERS; }
  async fetchEnvironments() { return AEGEA_COE_ENVIRONMENTS; }
  async fetchConnectors() { return AEGEA_COE_CONNECTORS; }
}

// ─── Dataverse OData client (producao real) ─────────────

class DataverseODataClient implements DataverseClient {
  private baseUrl: string;
  private token: string = '';
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl = process.env.DATAVERSE_URL || '';
    if (!this.baseUrl) throw new Error('DATAVERSE_URL nao configurada');
  }

  private async authenticate(): Promise<string> {
    const tenantId = process.env.DATAVERSE_TENANT_ID;
    if (!tenantId) throw new Error('DATAVERSE_TENANT_ID nao configurada');

    const res = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.DATAVERSE_CLIENT_ID || '',
          client_secret: process.env.DATAVERSE_CLIENT_SECRET || '',
          scope: `${this.baseUrl}/.default`,
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Falha na autenticacao Dataverse: ${res.status} ${errBody}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.token;
  }

  private async ensureToken(): Promise<string> {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      return this.authenticate();
    }
    return this.token;
  }

  private async odata<T>(entity: string, select?: string, filter?: string): Promise<T[]> {
    const token = await this.ensureToken();
    const params = new URLSearchParams();
    if (select) params.set('$select', select);
    if (filter) params.set('$filter', filter);
    params.set('$top', '5000');

    const qs = params.toString();
    const url = `${this.baseUrl}/api/data/v9.2/${entity}${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OData ${entity}: ${res.status} ${errBody}`);
    }

    const json = await res.json() as { value: T[] };
    return json.value;
  }

  async fetchApps(): Promise<CoeApp[]> {
    return this.odata<CoeApp>(
      'admin_apps',
      'admin_appid,admin_displayname,admin_appenvironment,admin_appowner,admin_appowneremail,admin_apptype,admin_appregional,admin_lastlauncheddate,admin_shareduserscount,admin_sessioncount,admin_connectors,admin_createdon,admin_modifiedon'
    );
  }

  async fetchFlows(): Promise<CoeFlow[]> {
    return this.odata<CoeFlow>(
      'admin_flows',
      'admin_flowid,admin_displayname,admin_flowenvironment,admin_flowowner,admin_flowowneremail,admin_flowstate,admin_flowtype,admin_triggertype,admin_connectors,admin_createdon,admin_modifiedon,admin_parentappid'
    );
  }

  async fetchMakers(): Promise<CoeMaker[]> {
    return this.odata<CoeMaker>(
      'admin_makers',
      'admin_makerid,admin_displayname,admin_useremail,admin_department,admin_city,admin_appscount,admin_flowscount,admin_lastactivedate'
    );
  }

  async fetchEnvironments(): Promise<CoeEnvironment[]> {
    return this.odata<CoeEnvironment>(
      'admin_environments',
      'admin_environmentid,admin_displayname,admin_environmenttype,admin_region,admin_appscount,admin_flowscount,admin_makerscount,admin_createdon'
    );
  }

  async fetchConnectors(): Promise<CoeConnectorUsage[]> {
    return this.odata<CoeConnectorUsage>('admin_connectorusage');
  }
}

// ─── Client factory ────────────────────────────────────

function getClient(): DataverseClient {
  const source = process.env.COE_DATA_SOURCE || 'local';

  if (source === 'dataverse') {
    logger.info('CoE data source: Dataverse OData');
    return new DataverseODataClient();
  }

  if (source === 'local') {
    logger.info('CoE data source: AEGEA local telemetry');
    return new LocalAegeaClient();
  }

  logger.info('CoE data source: mock (demo)');
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

  if (name.includes('compra') || name.includes('inadimplencia') || name.includes('financ') || name.includes('contabil') || name.includes('fiscal')) return 'FINANCEIRO';
  if (name.includes('colaborador') || name.includes('rh') || name.includes('epi') || name.includes('horas extras') || name.includes('dp ')) return 'CORPORATIVO';
  if (name.includes('obra') || name.includes('rede') || name.includes('inspecao') || name.includes('soleira') || name.includes('viabilidade') || name.includes('engenharia') || name.includes('contrat')) return 'ENGENHARIA';
  if (name.includes('qualidade') || name.includes('tratamento') || name.includes('eta') || name.includes('ete') || name.includes('excelencia') || name.includes('checklist') || name.includes('apontamento') || name.includes('rinc') || name.includes('coi ') || name.includes('turno')) return 'OPERACIONAL';
  if (name.includes('frota') || name.includes('logistic') || name.includes('almoxarifado') || name.includes('materiais') || name.includes('estoque') || name.includes('recebimento')) return 'OPERACIONAL';
  if (name.includes('leitura') || name.includes('hidrometro') || name.includes('medidor') || name.includes('vazao') || name.includes('nivel') || name.includes('holambra') || name.includes('volumetria')) return 'OPERACIONAL';
  if (name.includes('atende') || name.includes('agendamento') || name.includes('sala') || name.includes('administrativo') || name.includes('facilit') || name.includes('servico')) return 'CORPORATIVO';
  if (name.includes('relatorio') || name.includes('catalogo') || name.includes('analytics') || name.includes('link')) return 'GESTAO';
  if (name.includes('documento') || name.includes('escritura') || name.includes('meio ambiente') || name.includes('docs')) return 'GOVERNANCA';
  if (name.includes('fisc') || name.includes('ordem')) return 'OPERACIONAL';
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

  const activeApps = apps.filter(a => {
    try { return new Date(a.admin_lastlauncheddate) >= thirtyDaysAgo; } catch { return false; }
  });

  const regionalMap = new Map<string, number>();
  for (const app of apps) {
    const r = app.admin_appregional || 'Sem regional';
    regionalMap.set(r, (regionalMap.get(r) || 0) + 1);
  }
  const topRegionals = [...regionalMap.entries()]
    .map(([name, appsCount]) => ({ name, appsCount }))
    .sort((a, b) => b.appsCount - a.appsCount)
    .slice(0, 10);

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

  try {
    const [apps, flows, makers, environments, connectors] = await Promise.all([
      client.fetchApps(),
      client.fetchFlows(),
      client.fetchMakers(),
      client.fetchEnvironments(),
      client.fetchConnectors(),
    ]);

    results.push(
      { source: 'admin_apps', recordsFound: apps.length, recordsSynced: apps.length, errors: [], syncedAt: new Date().toISOString() },
      { source: 'admin_flows', recordsFound: flows.length, recordsSynced: flows.length, errors: [], syncedAt: new Date().toISOString() },
      { source: 'admin_makers', recordsFound: makers.length, recordsSynced: makers.length, errors: [], syncedAt: new Date().toISOString() },
      { source: 'admin_environments', recordsFound: environments.length, recordsSynced: environments.length, errors: [], syncedAt: new Date().toISOString() },
    );

    const computedMetrics = computeMetrics(apps, flows, makers, environments, connectors);
    const hasErrors = results.some(r => r.errors.length > 0);

    return { status: hasErrors ? 'partial' : 'success', duration: Date.now() - start, results, computedMetrics };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ source: 'global', recordsFound: 0, recordsSynced: 0, errors: [msg], syncedAt: new Date().toISOString() });
    return {
      status: 'error',
      duration: Date.now() - start,
      results,
      computedMetrics: { totalApps: 0, totalFlows: 0, totalMakers: 0, totalEnvironments: 0, premiumConnectorsCount: 0, activeAppsLast30Days: 0, topRegionals: [], connectorsByTier: { standard: 0, premium: 0, custom: 0 } },
    };
  }
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
    connectors: (() => { try { return JSON.parse(app.admin_connectors) as string[]; } catch { return []; } })(),
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
    connectors: (() => { try { return JSON.parse(f.admin_connectors) as string[]; } catch { return []; } })(),
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
