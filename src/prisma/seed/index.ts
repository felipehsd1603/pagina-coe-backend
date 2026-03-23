import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // ─── Limpar dados existentes ──────────────────────────────
  await prisma.appBenefit.deleteMany();
  await prisma.appDocument.deleteMany();
  await prisma.appMetric.deleteMany();
  await prisma.relatedFlow.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.globalMetric.deleteMany();
  await prisma.course.deleteMany();
  await prisma.app.deleteMany();
  await prisma.user.deleteMany();

  // ─── Usuarios Mock ────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      entraId: 'mock-admin-001',
      email: 'admin@aegea.mock',
      name: 'Administrador CoE',
      role: 'ADMIN',
    },
  });
  await prisma.user.create({
    data: {
      entraId: 'mock-editor-001',
      email: 'editor@aegea.mock',
      name: 'Editor CoE',
      role: 'EDITOR',
    },
  });
  await prisma.user.create({
    data: {
      entraId: 'mock-viewer-001',
      email: 'viewer@aegea.mock',
      name: 'Viewer CoE',
      role: 'VIEWER',
    },
  });
  console.log(`Usuarios mock criados: admin, editor, viewer`);

  // ─── Apps ─────────────────────────────────────────────────
  const apps = await Promise.all([
    prisma.app.create({
      data: {
        name: 'PipaeA',
        slug: 'pipaea',
        description:
          'Plataforma integrada de acompanhamento de execucao da AEGEA. Permite o monitoramento em tempo real de indicadores operacionais, metas e planos de acao das concessionarias.',
        shortDescription: 'Monitoramento de indicadores operacionais e metas das concessionarias',
        category: 'OPERACIONAL',
        phase: 'PRODUCAO',
        classification: 'CRITICAL',
        directive: 'SCALE',
        qualLevel: 'OURO',
        owner: 'Gerencia de Excelencia Operacional',
        ownerEmail: 'excelencia@aegea.com.br',
        regional: 'Corporativo',
        environment: 'Default-8991054c-e987-4297-a373-f9cf0e0c47ec',
        usersCount: 120,
        sessionsMonth: 2400,
        benefits: {
          create: [
            { title: 'Visibilidade em tempo real', description: 'Acompanhamento instantaneo dos KPIs operacionais' },
            { title: 'Reducao de reunioes', description: 'Menos reunioes de status com dashboards self-service' },
          ],
        },
        metrics: {
          create: [
            { label: 'Usuarios ativos', value: '120', icon: 'Users' },
            { label: 'Sessoes/mes', value: '2.400', icon: 'Activity' },
          ],
        },
        relatedFlows: {
          create: [
            { name: 'Sync Indicadores SAP', type: 'Power Automate' },
            { name: 'Dashboard PipaeA', type: 'Power BI' },
          ],
        },
      },
    }),

    prisma.app.create({
      data: {
        name: 'ADM Atende',
        slug: 'adm-atende',
        description:
          'Sistema de gestao de chamados administrativos e facilities. Centraliza solicitacoes de servicos internos como manutencao predial, TI, compras e logistica.',
        shortDescription: 'Gestao de chamados administrativos e facilities',
        category: 'CORPORATIVO',
        phase: 'PRODUCAO',
        classification: 'STANDARD',
        directive: 'MAINTAIN',
        qualLevel: 'PRATA',
        owner: 'Diretoria Administrativa',
        ownerEmail: 'administrativo@aegea.com.br',
        regional: 'Corporativo',
        environment: 'Default-8991054c-e987-4297-a373-f9cf0e0c47ec',
        usersCount: 85,
        sessionsMonth: 1200,
        benefits: {
          create: [
            { title: 'Centralizacao de chamados', description: 'Todas as solicitacoes em um unico lugar' },
            { title: 'SLA automatizado', description: 'Controle automatico de prazos e escalonamento' },
          ],
        },
        metrics: {
          create: [
            { label: 'Usuarios ativos', value: '85', icon: 'Users' },
            { label: 'Chamados/mes', value: '340', icon: 'Ticket' },
          ],
        },
      },
    }),

    prisma.app.create({
      data: {
        name: 'App Excelencia Operacional',
        slug: 'app-excelencia-operacional',
        description:
          'Aplicativo movel para coleta de dados em campo e auditorias de qualidade operacional. Permite registros fotograficos, checklists e envio offline.',
        shortDescription: 'Coleta de dados em campo e auditorias de qualidade operacional',
        category: 'OPERACIONAL',
        phase: 'PRODUCAO',
        classification: 'CRITICAL',
        directive: 'SCALE',
        qualLevel: 'OURO',
        owner: 'Gerencia de Qualidade',
        ownerEmail: 'qualidade@aegea.com.br',
        regional: 'Todas',
        environment: 'Default-8991054c-e987-4297-a373-f9cf0e0c47ec',
        usersCount: 200,
        sessionsMonth: 5600,
        benefits: {
          create: [
            { title: 'Coleta offline', description: 'Funciona em areas sem conexao de internet' },
            { title: 'Padronizacao', description: 'Checklists padronizados para todas as regionais' },
          ],
        },
        metrics: {
          create: [
            { label: 'Usuarios ativos', value: '200', icon: 'Users' },
            { label: 'Coletas/mes', value: '5.600', icon: 'ClipboardCheck' },
          ],
        },
      },
    }),

    prisma.app.create({
      data: {
        name: 'Portal Viabilidade Tecnica',
        slug: 'portal-viabilidade-tecnica',
        description:
          'Portal para analise de viabilidade tecnica de novos empreendimentos. Integra dados de capacidade hidrica, rede de distribuicao e custos de implantacao.',
        shortDescription: 'Analise de viabilidade tecnica para novos empreendimentos',
        category: 'ENGENHARIA',
        phase: 'PRODUCAO',
        classification: 'STANDARD',
        directive: 'MAINTAIN',
        qualLevel: 'PRATA',
        owner: 'Diretoria de Engenharia',
        ownerEmail: 'engenharia@aegea.com.br',
        regional: 'Corporativo',
        environment: 'Default-8991054c-e987-4297-a373-f9cf0e0c47ec',
        usersCount: 35,
        sessionsMonth: 280,
        benefits: {
          create: [
            { title: 'Analise integrada', description: 'Dados de capacidade e custo em um unico lugar' },
            { title: 'Agilidade', description: 'Reducao do tempo de analise de viabilidade em 60%' },
          ],
        },
        metrics: {
          create: [
            { label: 'Usuarios ativos', value: '35', icon: 'Users' },
            { label: 'Analises/mes', value: '48', icon: 'FileSearch' },
          ],
        },
      },
    }),

    prisma.app.create({
      data: {
        name: 'Gestao de Contratos',
        slug: 'gestao-contratos',
        description:
          'Aplicacao para gestao do ciclo de vida de contratos com fornecedores e prestadores de servico. Controla vencimentos, aditivos e compliance.',
        shortDescription: 'Gestao do ciclo de vida de contratos com fornecedores',
        category: 'FINANCEIRO',
        phase: 'PRODUCAO',
        classification: 'STANDARD',
        directive: 'MAINTAIN',
        qualLevel: 'BRONZE',
        owner: 'Gerencia de Compras',
        ownerEmail: 'compras@aegea.com.br',
        regional: 'Corporativo',
        usersCount: 42,
        sessionsMonth: 380,
        benefits: {
          create: [
            { title: 'Controle de vencimentos', description: 'Alertas automaticos de contratos a vencer' },
          ],
        },
        metrics: {
          create: [
            { label: 'Usuarios ativos', value: '42', icon: 'Users' },
            { label: 'Contratos gerenciados', value: '310', icon: 'FileText' },
          ],
        },
      },
    }),

    prisma.app.create({
      data: {
        name: 'Portal RH Digital',
        slug: 'portal-rh-digital',
        description:
          'Portal de autoatendimento para colaboradores. Inclui solicitacao de ferias, holerites, atualizacao cadastral e pesquisas de clima organizacional.',
        shortDescription: 'Autoatendimento RH para colaboradores',
        category: 'RH',
        phase: 'HOMOLOGACAO',
        classification: 'STANDARD',
        directive: 'EVALUATE',
        qualLevel: 'SEM_CLASSIFICACAO',
        owner: 'Diretoria de Pessoas',
        ownerEmail: 'rh@aegea.com.br',
        regional: 'Corporativo',
        usersCount: 0,
        sessionsMonth: 0,
        benefits: {
          create: [
            { title: 'Autoatendimento', description: 'Colaboradores resolvem demandas sem abrir chamado' },
            { title: 'Digitalizacao', description: 'Eliminacao de processos em papel' },
          ],
        },
      },
    }),

    prisma.app.create({
      data: {
        name: 'Monitor Ambiental',
        slug: 'monitor-ambiental',
        description:
          'Sistema de monitoramento de parametros ambientais e indicadores de sustentabilidade. Integra dados de estacoes de tratamento e pontos de coleta.',
        shortDescription: 'Monitoramento de parametros ambientais e sustentabilidade',
        category: 'SUSTENTABILIDADE',
        phase: 'DESENVOLVIMENTO',
        classification: 'LOW',
        directive: 'EVALUATE',
        qualLevel: 'SEM_CLASSIFICACAO',
        owner: 'Gerencia de Meio Ambiente',
        ownerEmail: 'meioambiente@aegea.com.br',
        regional: 'Corporativo',
        usersCount: 0,
        sessionsMonth: 0,
      },
    }),

    prisma.app.create({
      data: {
        name: 'App Leitura Comercial',
        slug: 'app-leitura-comercial',
        description:
          'Aplicativo movel para leituristas realizarem a leitura de hidrometros em campo. Integra com o sistema comercial para faturamento automatico.',
        shortDescription: 'Leitura de hidrometros em campo com integracao ao faturamento',
        category: 'COMERCIAL',
        phase: 'PRODUCAO',
        classification: 'CRITICAL',
        directive: 'SCALE',
        qualLevel: 'OURO',
        owner: 'Diretoria Comercial',
        ownerEmail: 'comercial@aegea.com.br',
        regional: 'Todas',
        environment: 'Default-8991054c-e987-4297-a373-f9cf0e0c47ec',
        usersCount: 150,
        sessionsMonth: 18000,
        benefits: {
          create: [
            { title: 'Leitura digital', description: 'Eliminacao de leitura em papel com foto do hidrometro' },
            { title: 'Faturamento agil', description: 'Integracao direta com sistema de faturamento' },
          ],
        },
        metrics: {
          create: [
            { label: 'Usuarios ativos', value: '150', icon: 'Users' },
            { label: 'Leituras/mes', value: '18.000', icon: 'Gauge' },
          ],
        },
        relatedFlows: {
          create: [
            { name: 'Sync Leituras ERP', type: 'Power Automate' },
          ],
        },
      },
    }),
  ]);

  console.log(`${apps.length} apps criados`);

  // ─── Metricas Globais ─────────────────────────────────────
  const metrics = await Promise.all([
    prisma.globalMetric.create({
      data: { key: 'usuarios_ativos', label: 'Usuarios Ativos', value: '339', icon: 'Users' },
    }),
    prisma.globalMetric.create({
      data: { key: 'apps_catalogo', label: 'Apps no Catalogo', value: '80+', icon: 'LayoutGrid' },
    }),
    prisma.globalMetric.create({
      data: { key: 'ambientes', label: 'Ambientes', value: '72', icon: 'Server' },
    }),
    prisma.globalMetric.create({
      data: { key: 'regionais', label: 'Regionais', value: '15+', icon: 'MapPin' },
    }),
  ]);
  console.log(`${metrics.length} metricas globais criadas`);

  // ─── Depoimentos ──────────────────────────────────────────
  const testimonials = await Promise.all([
    prisma.testimonial.create({
      data: {
        appId: apps[0].id, // PipaeA
        authorName: 'Carlos Mendes',
        authorRole: 'Gerente de Operacoes',
        authorArea: 'Operacoes - Aguas de Manaus',
        content:
          'O PipaeA transformou a forma como acompanhamos nossos indicadores. Antes levavamos horas compilando dados de diferentes fontes, hoje temos tudo em tempo real.',
        rating: 5,
        published: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        appId: apps[1].id, // ADM Atende
        authorName: 'Ana Paula Silva',
        authorRole: 'Coordenadora Administrativa',
        authorArea: 'Administrativo - Prolagos',
        content:
          'Com o ADM Atende conseguimos reduzir o tempo medio de atendimento dos chamados internos em 40%. A equipe ganhou produtividade e os colaboradores ficaram mais satisfeitos.',
        rating: 5,
        published: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        appId: apps[2].id, // Excelencia Operacional
        authorName: 'Roberto Alves',
        authorRole: 'Supervisor de Campo',
        authorArea: 'Qualidade - Aguas de Teresina',
        content:
          'O app funciona mesmo sem internet, o que e essencial para nosso trabalho em campo. As auditorias ficaram muito mais ageis e padronizadas.',
        rating: 5,
        published: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        appId: apps[3].id, // Portal Viabilidade
        authorName: 'Fernanda Costa',
        authorRole: 'Engenheira de Projetos',
        authorArea: 'Engenharia - Corporativo',
        content:
          'A analise de viabilidade que antes levava semanas agora e feita em dias. O portal integra todos os dados que precisamos para tomar decisoes rapidas.',
        rating: 4,
        published: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        appId: apps[7].id, // Leitura Comercial
        authorName: 'Jose Santos',
        authorRole: 'Coordenador Comercial',
        authorArea: 'Comercial - Aguas de Holambra',
        content:
          'A digitalizacao da leitura eliminou erros de transcricao e acelerou o ciclo de faturamento. Os leituristas se adaptaram rapidamente ao aplicativo.',
        rating: 5,
        published: true,
      },
    }),
    prisma.testimonial.create({
      data: {
        appId: null,
        authorName: 'Mariana Oliveira',
        authorRole: 'Diretora de Transformacao Digital',
        authorArea: 'TI - Corporativo',
        content:
          'A Power Platform tem sido um pilar fundamental da nossa estrategia de transformacao digital. O CoE trouxe governanca sem frear a inovacao nas regionais.',
        rating: 5,
        published: true,
      },
    }),
  ]);
  console.log(`${testimonials.length} depoimentos criados`);

  // ─── Cursos ───────────────────────────────────────────────
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        title: 'Introducao ao Power Apps',
        description: 'Curso basico para iniciantes na Power Platform. Aprenda a criar seu primeiro aplicativo canvas.',
        tier: 'T1',
        durationMin: 120,
        provider: 'Microsoft Learn',
        url: 'https://learn.microsoft.com/training/paths/create-powerapps/',
      },
    }),
    prisma.course.create({
      data: {
        title: 'Power Automate Essencial',
        description: 'Aprenda a automatizar processos com Power Automate. Fluxos de nuvem, aprovacoes e conectores.',
        tier: 'T1',
        durationMin: 90,
        provider: 'Microsoft Learn',
        url: 'https://learn.microsoft.com/training/paths/automate-process-power-automate/',
      },
    }),
    prisma.course.create({
      data: {
        title: 'Power Apps Model-Driven',
        description: 'Desenvolvimento de aplicacoes model-driven com Dataverse. Formularios, views e business rules.',
        tier: 'T2',
        durationMin: 180,
        provider: 'CoE AEGEA',
      },
    }),
    prisma.course.create({
      data: {
        title: 'Governanca e ALM na Power Platform',
        description: 'Boas praticas de governanca, ambientes, DLP policies e Application Lifecycle Management.',
        tier: 'T3',
        durationMin: 240,
        provider: 'CoE AEGEA',
      },
    }),
    prisma.course.create({
      data: {
        title: 'Desenvolvimento com PCF Controls',
        description: 'Criacao de componentes customizados com Power Apps Component Framework (PCF) usando React e TypeScript.',
        tier: 'T4',
        durationMin: 360,
        provider: 'CoE AEGEA',
      },
    }),
    prisma.course.create({
      data: {
        title: 'Integracao com APIs e Conectores Custom',
        description: 'Construcao de conectores customizados, integracao com APIs REST e autenticacao OAuth.',
        tier: 'T3',
        durationMin: 200,
        provider: 'CoE AEGEA',
      },
    }),
  ]);
  console.log(`${courses.length} cursos criados`);

  // ─── Demandas ─────────────────────────────────────────────
  const demands = await Promise.all([
    prisma.demand.create({
      data: {
        title: 'App de Gestao de EPIs',
        description:
          'Necessidade de um aplicativo para controlar entrega e devolucao de Equipamentos de Protecao Individual nos centros operacionais.',
        requesterName: 'Paulo Ferreira',
        requesterEmail: 'paulo.ferreira@aegea.com.br',
        area: 'Seguranca do Trabalho',
        priority: 'HIGH',
        status: 'IN_REVIEW',
      },
    }),
    prisma.demand.create({
      data: {
        title: 'Dashboard de Perdas Comerciais',
        description:
          'Dashboard para acompanhamento de indicadores de perdas comerciais por regional, com drill-down por tipo de perda e periodo.',
        requesterName: 'Lucia Barbosa',
        requesterEmail: 'lucia.barbosa@aegea.com.br',
        area: 'Comercial',
        priority: 'MEDIUM',
        status: 'PENDING',
      },
    }),
  ]);
  console.log(`${demands.length} demandas criadas`);

  console.log('Seed concluido com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
