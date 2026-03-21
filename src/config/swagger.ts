import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portal EMPRESA_FICTICIA - API',
      version: '1.0.0',
      description: 'API do Portal de Produtos Digitais e Automacoes do CoE Power Platform - EMPRESA_FICTICIA',
      contact: {
        name: 'CoE Power Platform - EMPRESA_FICTICIA',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via POST /auth/login (mock) ou Microsoft Entra ID',
        },
      },
      schemas: {
        App: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Gestao de Obras' },
            slug: { type: 'string', example: 'gestao-de-obras' },
            description: { type: 'string' },
            shortDescription: { type: 'string' },
            category: { type: 'string', enum: ['OPERACIONAL', 'COMERCIAL', 'CORPORATIVO', 'FINANCEIRO', 'ENGENHARIA', 'RH', 'SUSTENTABILIDADE', 'TI'] },
            phase: { type: 'string', enum: ['IDEACAO', 'DESENVOLVIMENTO', 'HOMOLOGACAO', 'PRODUCAO', 'DESATIVADO'] },
            classification: { type: 'string', enum: ['CRITICAL', 'STANDARD', 'LOW'] },
            directive: { type: 'string', enum: ['SCALE', 'MAINTAIN', 'RETIRE', 'EVALUATE'] },
            qualLevel: { type: 'string', enum: ['OURO', 'PRATA', 'BRONZE', 'SEM_CLASSIFICACAO'] },
            owner: { type: 'string' },
            ownerEmail: { type: 'string' },
            regional: { type: 'string' },
            environment: { type: 'string' },
            iconUrl: { type: 'string' },
            bannerUrl: { type: 'string' },
            appUrl: { type: 'string' },
            usersCount: { type: 'integer' },
            sessionsMonth: { type: 'integer' },
            published: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AppDetail: {
          allOf: [
            { $ref: '#/components/schemas/App' },
            {
              type: 'object',
              properties: {
                benefits: { type: 'array', items: { $ref: '#/components/schemas/AppBenefit' } },
                documents: { type: 'array', items: { $ref: '#/components/schemas/AppDocument' } },
                metrics: { type: 'array', items: { $ref: '#/components/schemas/AppMetric' } },
                relatedFlows: { type: 'array', items: { $ref: '#/components/schemas/RelatedFlow' } },
                testimonials: { type: 'array', items: { $ref: '#/components/schemas/Testimonial' } },
              },
            },
          ],
        },
        AppBenefit: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
          },
        },
        AppDocument: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            url: { type: 'string' },
            type: { type: 'string', enum: ['PDF', 'LINK', 'VIDEO'] },
          },
        },
        AppMetric: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
            value: { type: 'string' },
            icon: { type: 'string' },
          },
        },
        RelatedFlow: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { type: 'string' },
          },
        },
        Testimonial: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            appId: { type: 'string', format: 'uuid', nullable: true },
            authorName: { type: 'string' },
            authorRole: { type: 'string' },
            authorArea: { type: 'string' },
            content: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            published: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Demand: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            requesterName: { type: 'string' },
            requesterEmail: { type: 'string', format: 'email' },
            area: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            status: { type: 'string', enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'] },
            adminNotes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        DemandCreate: {
          type: 'object',
          required: ['title', 'description', 'requesterName', 'requesterEmail', 'area'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            requesterName: { type: 'string' },
            requesterEmail: { type: 'string', format: 'email' },
            area: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          },
        },
        GlobalMetric: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            key: { type: 'string' },
            label: { type: 'string' },
            value: { type: 'string' },
            icon: { type: 'string' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            tier: { type: 'string', enum: ['T1', 'T2', 'T3', 'T4'] },
            url: { type: 'string' },
            durationMin: { type: 'integer' },
            provider: { type: 'string' },
            published: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@aegea.mock' },
            password: { type: 'string', example: 'AegeaAdmin2025!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Apps', description: 'Catalogo de aplicacoes Power Platform' },
      { name: 'Metrics', description: 'KPIs globais do CoE' },
      { name: 'Testimonials', description: 'Depoimentos de usuarios' },
      { name: 'Courses', description: 'Cursos do programa Citizen Developer' },
      { name: 'Demands', description: 'Gestao de demandas' },
      { name: 'Auth', description: 'Autenticacao (Mock / Entra ID)' },
      { name: 'CoE Sync', description: 'Integracao com CoE Starter Kit (Dataverse) — apps, flows, makers, ambientes, conectores' },
      { name: 'Admin - Apps', description: 'Enriquecimento editorial de apps (descricao, banner, beneficios)' },
      { name: 'Admin - Testimonials', description: 'CRUD de depoimentos' },
      { name: 'Admin - Demands', description: 'Gestao de demandas' },
      { name: 'Admin - Courses', description: 'CRUD de cursos' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
