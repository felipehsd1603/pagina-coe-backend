/**
 * Mock dos dados que viriam do Dataverse (CoE Starter Kit).
 *
 * Em producao, esses dados sao obtidos via OData:
 *   GET https://{org}.crm2.dynamics.com/api/data/v9.2/admin_apps
 *   GET https://{org}.crm2.dynamics.com/api/data/v9.2/admin_flows
 *   GET https://{org}.crm2.dynamics.com/api/data/v9.2/admin_makers
 *   GET https://{org}.crm2.dynamics.com/api/data/v9.2/admin_environments
 *   GET https://{org}.crm2.dynamics.com/api/data/v9.2/admin_connectors
 */

// ─── Apps (admin_apps) ──────────────────────────────────

export interface CoeApp {
  admin_appid: string;
  admin_displayname: string;
  admin_appenvironment: string;
  admin_appowner: string;
  admin_appowneremail: string;
  admin_apptype: string; // CanvasApp, ModelDrivenApp, etc.
  admin_appregional: string;
  admin_lastlauncheddate: string;
  admin_shareduserscount: number;
  admin_sessioncount: number;
  admin_connectors: string; // JSON array of connector names
  admin_createdon: string;
  admin_modifiedon: string;
}

export const MOCK_COE_APPS: CoeApp[] = [
  {
    admin_appid: 'coe-app-001',
    admin_displayname: 'Gestao de Obras',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Carlos Silva',
    admin_appowneremail: 'carlos.silva@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Aguas do Rio de Janeiro',
    admin_lastlauncheddate: '2026-03-18T14:30:00Z',
    admin_shareduserscount: 245,
    admin_sessioncount: 3420,
    admin_connectors: JSON.stringify(['SharePoint', 'Office 365 Outlook', 'SQL Server']),
    admin_createdon: '2024-06-15T10:00:00Z',
    admin_modifiedon: '2026-03-10T08:45:00Z',
  },
  {
    admin_appid: 'coe-app-002',
    admin_displayname: 'Leitura de Hidrometros',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Ana Oliveira',
    admin_appowneremail: 'ana.oliveira@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Aguas de Teresina',
    admin_lastlauncheddate: '2026-03-19T09:15:00Z',
    admin_shareduserscount: 180,
    admin_sessioncount: 8750,
    admin_connectors: JSON.stringify(['Dataverse', 'Power Automate', 'AI Builder']),
    admin_createdon: '2024-03-20T14:00:00Z',
    admin_modifiedon: '2026-02-28T16:20:00Z',
  },
  {
    admin_appid: 'coe-app-003',
    admin_displayname: 'Controle de EPI',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Roberto Santos',
    admin_appowneremail: 'roberto.santos@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Aguas de Manaus',
    admin_lastlauncheddate: '2026-03-17T11:00:00Z',
    admin_shareduserscount: 320,
    admin_sessioncount: 5100,
    admin_connectors: JSON.stringify(['SharePoint', 'Approvals', 'Office 365 Users']),
    admin_createdon: '2024-09-01T08:00:00Z',
    admin_modifiedon: '2026-03-05T10:30:00Z',
  },
  {
    admin_appid: 'coe-app-004',
    admin_displayname: 'Gestao de Frotas',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Fernanda Lima',
    admin_appowneremail: 'fernanda.lima@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Aguas de Guariroba',
    admin_lastlauncheddate: '2026-03-19T16:45:00Z',
    admin_shareduserscount: 95,
    admin_sessioncount: 2300,
    admin_connectors: JSON.stringify(['Dataverse', 'Power BI', 'Office 365 Outlook']),
    admin_createdon: '2025-01-10T09:00:00Z',
    admin_modifiedon: '2026-03-12T14:15:00Z',
  },
  {
    admin_appid: 'coe-app-005',
    admin_displayname: 'Checklist de Qualidade da Agua',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Marcos Pereira',
    admin_appowneremail: 'marcos.pereira@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Corsan',
    admin_lastlauncheddate: '2026-03-20T07:30:00Z',
    admin_shareduserscount: 410,
    admin_sessioncount: 12800,
    admin_connectors: JSON.stringify(['SharePoint', 'Power Automate', 'Approvals', 'SQL Server']),
    admin_createdon: '2023-11-05T11:00:00Z',
    admin_modifiedon: '2026-03-15T09:00:00Z',
  },
  {
    admin_appid: 'coe-app-006',
    admin_displayname: 'Portal do Colaborador',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Juliana Costa',
    admin_appowneremail: 'juliana.costa@aegea.com.br',
    admin_apptype: 'ModelDrivenApp',
    admin_appregional: 'Corporativo',
    admin_lastlauncheddate: '2026-03-20T10:00:00Z',
    admin_shareduserscount: 1200,
    admin_sessioncount: 45000,
    admin_connectors: JSON.stringify(['Dataverse', 'Office 365 Users', 'SharePoint']),
    admin_createdon: '2023-06-01T08:00:00Z',
    admin_modifiedon: '2026-03-18T11:30:00Z',
  },
  {
    admin_appid: 'coe-app-007',
    admin_displayname: 'Solicitacao de Compras',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Paulo Mendes',
    admin_appowneremail: 'paulo.mendes@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Corporativo',
    admin_lastlauncheddate: '2026-03-19T14:20:00Z',
    admin_shareduserscount: 530,
    admin_sessioncount: 15200,
    admin_connectors: JSON.stringify(['Dataverse', 'Approvals', 'SAP', 'Office 365 Outlook']),
    admin_createdon: '2024-02-12T10:00:00Z',
    admin_modifiedon: '2026-03-14T16:45:00Z',
  },
  {
    admin_appid: 'coe-app-008',
    admin_displayname: 'Inspecao de Redes',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Diego Almeida',
    admin_appowneremail: 'diego.almeida@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Aguas de Timon',
    admin_lastlauncheddate: '2026-03-18T08:15:00Z',
    admin_shareduserscount: 75,
    admin_sessioncount: 1800,
    admin_connectors: JSON.stringify(['SharePoint', 'Power Automate', 'GPS']),
    admin_createdon: '2025-04-20T09:00:00Z',
    admin_modifiedon: '2026-03-01T13:00:00Z',
  },
  {
    admin_appid: 'coe-app-009',
    admin_displayname: 'Controle de Tratamento ETA/ETE',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Luciana Barbosa',
    admin_appowneremail: 'luciana.barbosa@aegea.com.br',
    admin_apptype: 'CanvasApp',
    admin_appregional: 'Aguas de Sinop',
    admin_lastlauncheddate: '2026-03-20T06:00:00Z',
    admin_shareduserscount: 155,
    admin_sessioncount: 6400,
    admin_connectors: JSON.stringify(['Dataverse', 'Power Automate', 'Excel Online']),
    admin_createdon: '2024-07-08T14:00:00Z',
    admin_modifiedon: '2026-03-17T10:20:00Z',
  },
  {
    admin_appid: 'coe-app-010',
    admin_displayname: 'Gestao de Inadimplencia',
    admin_appenvironment: 'Producao - Aegea Saneamento',
    admin_appowner: 'Ricardo Ferreira',
    admin_appowneremail: 'ricardo.ferreira@aegea.com.br',
    admin_apptype: 'ModelDrivenApp',
    admin_appregional: 'Aguas do Rio de Janeiro',
    admin_lastlauncheddate: '2026-03-19T11:30:00Z',
    admin_shareduserscount: 88,
    admin_sessioncount: 3100,
    admin_connectors: JSON.stringify(['Dataverse', 'SQL Server', 'Power BI', 'SAP']),
    admin_createdon: '2025-02-15T10:00:00Z',
    admin_modifiedon: '2026-03-16T15:00:00Z',
  },
];

// ─── Flows (admin_flows) ────────────────────────────────

export interface CoeFlow {
  admin_flowid: string;
  admin_displayname: string;
  admin_flowenvironment: string;
  admin_flowowner: string;
  admin_flowowneremail: string;
  admin_flowstate: string; // Started, Stopped, Suspended
  admin_flowtype: string; // Automated, Scheduled, Instant, Button
  admin_triggertype: string;
  admin_connectors: string;
  admin_createdon: string;
  admin_modifiedon: string;
  admin_parentappid?: string; // link to CoeApp
}

export const MOCK_COE_FLOWS: CoeFlow[] = [
  {
    admin_flowid: 'coe-flow-001',
    admin_displayname: 'Notificar nova obra cadastrada',
    admin_flowenvironment: 'Producao - Aegea Saneamento',
    admin_flowowner: 'Carlos Silva',
    admin_flowowneremail: 'carlos.silva@aegea.com.br',
    admin_flowstate: 'Started',
    admin_flowtype: 'Automated',
    admin_triggertype: 'Dataverse - When a row is added',
    admin_connectors: JSON.stringify(['Dataverse', 'Office 365 Outlook', 'Teams']),
    admin_createdon: '2024-06-20T10:00:00Z',
    admin_modifiedon: '2026-01-15T08:00:00Z',
    admin_parentappid: 'coe-app-001',
  },
  {
    admin_flowid: 'coe-flow-002',
    admin_displayname: 'Aprovacao de compra acima de R$10k',
    admin_flowenvironment: 'Producao - Aegea Saneamento',
    admin_flowowner: 'Paulo Mendes',
    admin_flowowneremail: 'paulo.mendes@aegea.com.br',
    admin_flowstate: 'Started',
    admin_flowtype: 'Automated',
    admin_triggertype: 'Dataverse - When a row is modified',
    admin_connectors: JSON.stringify(['Dataverse', 'Approvals', 'Office 365 Outlook', 'Teams']),
    admin_createdon: '2024-03-01T14:00:00Z',
    admin_modifiedon: '2026-02-20T11:00:00Z',
    admin_parentappid: 'coe-app-007',
  },
  {
    admin_flowid: 'coe-flow-003',
    admin_displayname: 'Relatorio diario qualidade da agua',
    admin_flowenvironment: 'Producao - Aegea Saneamento',
    admin_flowowner: 'Marcos Pereira',
    admin_flowowneremail: 'marcos.pereira@aegea.com.br',
    admin_flowstate: 'Started',
    admin_flowtype: 'Scheduled',
    admin_triggertype: 'Recurrence - Daily 06:00',
    admin_connectors: JSON.stringify(['SharePoint', 'Office 365 Outlook', 'Excel Online']),
    admin_createdon: '2024-01-10T08:00:00Z',
    admin_modifiedon: '2026-03-01T07:00:00Z',
    admin_parentappid: 'coe-app-005',
  },
  {
    admin_flowid: 'coe-flow-004',
    admin_displayname: 'Sync leitura hidrometros para SAP',
    admin_flowenvironment: 'Producao - Aegea Saneamento',
    admin_flowowner: 'Ana Oliveira',
    admin_flowowneremail: 'ana.oliveira@aegea.com.br',
    admin_flowstate: 'Started',
    admin_flowtype: 'Automated',
    admin_triggertype: 'Dataverse - When a row is added',
    admin_connectors: JSON.stringify(['Dataverse', 'SAP', 'Power Automate']),
    admin_createdon: '2024-04-15T09:00:00Z',
    admin_modifiedon: '2026-03-10T14:00:00Z',
    admin_parentappid: 'coe-app-002',
  },
  {
    admin_flowid: 'coe-flow-005',
    admin_displayname: 'Alerta EPI vencido',
    admin_flowenvironment: 'Producao - Aegea Saneamento',
    admin_flowowner: 'Roberto Santos',
    admin_flowowneremail: 'roberto.santos@aegea.com.br',
    admin_flowstate: 'Started',
    admin_flowtype: 'Scheduled',
    admin_triggertype: 'Recurrence - Daily 07:00',
    admin_connectors: JSON.stringify(['SharePoint', 'Office 365 Outlook', 'Teams']),
    admin_createdon: '2024-10-01T08:00:00Z',
    admin_modifiedon: '2026-02-10T09:00:00Z',
    admin_parentappid: 'coe-app-003',
  },
];

// ─── Makers (admin_makers) ──────────────────────────────

export interface CoeMaker {
  admin_makerid: string;
  admin_displayname: string;
  admin_useremail: string;
  admin_department: string;
  admin_city: string;
  admin_appscount: number;
  admin_flowscount: number;
  admin_lastactivedate: string;
}

export const MOCK_COE_MAKERS: CoeMaker[] = [
  { admin_makerid: 'maker-001', admin_displayname: 'Carlos Silva', admin_useremail: 'carlos.silva@aegea.com.br', admin_department: 'Engenharia', admin_city: 'Rio de Janeiro', admin_appscount: 3, admin_flowscount: 5, admin_lastactivedate: '2026-03-19T14:00:00Z' },
  { admin_makerid: 'maker-002', admin_displayname: 'Ana Oliveira', admin_useremail: 'ana.oliveira@aegea.com.br', admin_department: 'Operacoes', admin_city: 'Teresina', admin_appscount: 2, admin_flowscount: 4, admin_lastactivedate: '2026-03-20T09:00:00Z' },
  { admin_makerid: 'maker-003', admin_displayname: 'Roberto Santos', admin_useremail: 'roberto.santos@aegea.com.br', admin_department: 'Seguranca', admin_city: 'Manaus', admin_appscount: 1, admin_flowscount: 2, admin_lastactivedate: '2026-03-18T11:00:00Z' },
  { admin_makerid: 'maker-004', admin_displayname: 'Fernanda Lima', admin_useremail: 'fernanda.lima@aegea.com.br', admin_department: 'Logistica', admin_city: 'Campo Grande', admin_appscount: 2, admin_flowscount: 3, admin_lastactivedate: '2026-03-19T16:00:00Z' },
  { admin_makerid: 'maker-005', admin_displayname: 'Marcos Pereira', admin_useremail: 'marcos.pereira@aegea.com.br', admin_department: 'Qualidade', admin_city: 'Porto Alegre', admin_appscount: 4, admin_flowscount: 7, admin_lastactivedate: '2026-03-20T07:00:00Z' },
  { admin_makerid: 'maker-006', admin_displayname: 'Juliana Costa', admin_useremail: 'juliana.costa@aegea.com.br', admin_department: 'RH', admin_city: 'Sao Paulo', admin_appscount: 1, admin_flowscount: 2, admin_lastactivedate: '2026-03-20T10:00:00Z' },
  { admin_makerid: 'maker-007', admin_displayname: 'Paulo Mendes', admin_useremail: 'paulo.mendes@aegea.com.br', admin_department: 'Financeiro', admin_city: 'Sao Paulo', admin_appscount: 2, admin_flowscount: 6, admin_lastactivedate: '2026-03-19T14:00:00Z' },
  { admin_makerid: 'maker-008', admin_displayname: 'Diego Almeida', admin_useremail: 'diego.almeida@aegea.com.br', admin_department: 'Operacoes', admin_city: 'Timon', admin_appscount: 1, admin_flowscount: 1, admin_lastactivedate: '2026-03-18T08:00:00Z' },
  { admin_makerid: 'maker-009', admin_displayname: 'Luciana Barbosa', admin_useremail: 'luciana.barbosa@aegea.com.br', admin_department: 'Operacoes', admin_city: 'Sinop', admin_appscount: 2, admin_flowscount: 3, admin_lastactivedate: '2026-03-20T06:00:00Z' },
  { admin_makerid: 'maker-010', admin_displayname: 'Ricardo Ferreira', admin_useremail: 'ricardo.ferreira@aegea.com.br', admin_department: 'Financeiro', admin_city: 'Rio de Janeiro', admin_appscount: 1, admin_flowscount: 2, admin_lastactivedate: '2026-03-19T11:00:00Z' },
];

// ─── Environments (admin_environments) ──────────────────

export interface CoeEnvironment {
  admin_environmentid: string;
  admin_displayname: string;
  admin_environmenttype: string; // Production, Sandbox, Developer, Default
  admin_region: string;
  admin_appscount: number;
  admin_flowscount: number;
  admin_makerscount: number;
  admin_createdon: string;
}

export const MOCK_COE_ENVIRONMENTS: CoeEnvironment[] = [
  { admin_environmentid: 'env-001', admin_displayname: 'Producao - Aegea Saneamento', admin_environmenttype: 'Production', admin_region: 'Brazil', admin_appscount: 42, admin_flowscount: 85, admin_makerscount: 120, admin_createdon: '2023-01-15T08:00:00Z' },
  { admin_environmentid: 'env-002', admin_displayname: 'Homologacao - Aegea', admin_environmenttype: 'Sandbox', admin_region: 'Brazil', admin_appscount: 28, admin_flowscount: 45, admin_makerscount: 35, admin_createdon: '2023-03-01T10:00:00Z' },
  { admin_environmentid: 'env-003', admin_displayname: 'Desenvolvimento - CoE', admin_environmenttype: 'Developer', admin_region: 'Brazil', admin_appscount: 15, admin_flowscount: 22, admin_makerscount: 8, admin_createdon: '2023-06-10T14:00:00Z' },
  { admin_environmentid: 'env-004', admin_displayname: 'Default-8991054c', admin_environmenttype: 'Default', admin_region: 'Brazil', admin_appscount: 12, admin_flowscount: 18, admin_makerscount: 45, admin_createdon: '2022-05-01T08:00:00Z' },
  { admin_environmentid: 'env-005', admin_displayname: 'Sandbox - Citizen Devs T1', admin_environmenttype: 'Sandbox', admin_region: 'Brazil', admin_appscount: 8, admin_flowscount: 10, admin_makerscount: 25, admin_createdon: '2024-01-20T09:00:00Z' },
];

// ─── Connectors Usage (admin_connectors) ────────────────

export interface CoeConnectorUsage {
  connectorName: string;
  tier: 'Standard' | 'Premium' | 'Custom';
  appsUsingCount: number;
  flowsUsingCount: number;
}

export const MOCK_COE_CONNECTORS: CoeConnectorUsage[] = [
  { connectorName: 'SharePoint', tier: 'Standard', appsUsingCount: 35, flowsUsingCount: 52 },
  { connectorName: 'Office 365 Outlook', tier: 'Standard', appsUsingCount: 28, flowsUsingCount: 40 },
  { connectorName: 'Dataverse', tier: 'Premium', appsUsingCount: 22, flowsUsingCount: 38 },
  { connectorName: 'Approvals', tier: 'Standard', appsUsingCount: 15, flowsUsingCount: 25 },
  { connectorName: 'Teams', tier: 'Standard', appsUsingCount: 12, flowsUsingCount: 30 },
  { connectorName: 'SQL Server', tier: 'Premium', appsUsingCount: 8, flowsUsingCount: 12 },
  { connectorName: 'SAP', tier: 'Premium', appsUsingCount: 4, flowsUsingCount: 6 },
  { connectorName: 'Power BI', tier: 'Standard', appsUsingCount: 10, flowsUsingCount: 5 },
  { connectorName: 'Excel Online', tier: 'Standard', appsUsingCount: 18, flowsUsingCount: 15 },
  { connectorName: 'AI Builder', tier: 'Premium', appsUsingCount: 3, flowsUsingCount: 4 },
  { connectorName: 'Office 365 Users', tier: 'Standard', appsUsingCount: 20, flowsUsingCount: 8 },
  { connectorName: 'Power Automate', tier: 'Standard', appsUsingCount: 6, flowsUsingCount: 0 },
];
