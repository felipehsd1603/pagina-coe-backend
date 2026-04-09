import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Portal AEGEA - API',
      version: '1.1.0',
      description: 'API do Portal de Produtos Digitais e Automacoes do CoE Power Platform - AEGEA',
      contact: {
        name: 'CoE Power Platform - AEGEA',
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
            ownerEmail: { type: 'string', description: 'LGPD: oculto sem autenticacao' },
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
            adminNotes: { type: 'string', nullable: true },
            lgpdConsentAt: { type: 'string', format: 'date-time', nullable: true, description: 'LGPD: timestamp do consentimento' },
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
            lgpdConsent: { type: 'boolean', description: 'LGPD: consentimento do titular para tratamento de dados pessoais' },
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
            // SECURITY: Password example removed - do not expose credentials in API docs
            password: { type: 'string', example: '********' },
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
        DemandUpdate: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            adminNotes: { type: 'string', maxLength: 5000, nullable: true },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['VIEWER', 'EDITOR', 'ADMIN'] },
            entraId: { type: 'string', nullable: true },
            isActive: { type: 'boolean', description: 'Status ativo/inativo do usuario' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true, description: 'Data do ultimo login' },
            department: { type: 'string', nullable: true, description: 'Departamento (vindo do Entra ID)' },
            jobTitle: { type: 'string', nullable: true, description: 'Cargo (vindo do Entra ID)' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LogoutResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Logout realizado com sucesso' },
          },
        },
        PaginatedApps: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/App' } },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Dados invalidos' },
            details: { type: 'object' },
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
      { name: 'Admin - Users', description: 'CRUD de usuarios (ADMIN only)' },
      { name: 'Admin - Apps', description: 'Enriquecimento editorial de apps (descricao, banner, beneficios)' },
      { name: 'Admin - Testimonials', description: 'CRUD de depoimentos' },
      { name: 'Admin - Demands', description: 'Gestao de demandas' },
      { name: 'Admin - Courses', description: 'CRUD de cursos' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
