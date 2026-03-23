# Portal CoE AEGEA - Backend API

Esta é a API central de Governança para ferramentas de Low-Code e soluções mapeadas no modelo do CoE da AEGEA. Ela atua como intermediário, responsável por servir dados do Power Platform armazenados localmente no SQL Server (sincronizados da API original do Dataverse) para abastecer relatórios estáticos, aprovação rápida e o vitrine/catálogo das soluções.

## 🚀 Tecnologias (Stack)
- **Node.js (LTS v18/v20+)**
- **Express.js** 
- **TypeScript** (Tipagem forte com `tsx` rodando dinamicamente em dev)
- **Prisma ORM** (Migrações e cliente unificado para SQL Server)
- **Microsoft SQL Server Express local / Azure SQL DB**
- **Proteção e middlewares padrão enterprise:** CORS, express-rate-limit, e Helmet.
- **Node-Fetch**: Usado para extrair métricas do MS Dataverse via OData API `v9.2`.
- **JWT / MSAL Node**: Sistema adaptativo para troca entre Token Simulado ou Validação Oficial Microsoft Entra ID.
- **Zod**: Garantia/Validação de parsing severo das variáveis em tempo de subida (arquivos de ambiente).

## 🏢 Arquitetura
A arquitetura se baseia em um **padrão monolito com controladores segmentados (MVC de API)**:
* `src/routes/`: Definições globais de rotas expostas separadas por entidades (`apps`, `metrics`, `coesync`).
* `src/controllers/`: Controladores de Request/Response agnósticos à camada de negócio.
* `src/services/` (opcional): Modelagem e processamento interno antes do repasse ao cliente (validadões).
* `src/prisma/`: O arquivo vital de arquitetura relacional entre tabelas via **schema.prisma**. 

## 🛠️ Instalação e Execução (Modo Local + SQL)
Certifique-se que você tenha o Node.js instalado e uma instância do **SQL Server instalada e com protocolo TCP ativo na porta `1433`** (ou ajuste no string).

```bash
# 1. Instalar depẽncias
npm install

# 2. Configure as Variaveis! Faça uma cópia do `.env.example` e renomeie para `.env`
# Siga a sessão de Variáveis de Ambiente abaixo

# 3. Injete a arquitetura do banco e as Seeds mockadas
npx prisma db push --schema src/prisma/schema.prisma
npx prisma db seed

# 4. Iniciar o servidor
npm run dev
```

O projeto deve anunciar `[backend] Servidor rodando na porta 4000 (development)` no terminal. Todo erro de carregamento será exibido, incluindo erro nas variáveis via `Zod`.

### 🪪 Variáveis de Ambiente e Integração com Dataverse MOCK
**O portal possui dois modos**: ambiente isolado de dev (MOCK) e ambiente real com Dataverse/Entra ID (PRODUÇÃO).

Crie o arquivo `.env` com a seguinte estrutura:
```env
PORT=4000
NODE_ENV=development

# Muta a estratégia de login: 'mock' ou 'entra' (Entra ID MSAL)
AUTH_MODE=mock

# Requisitos para tokens JWT no modo local
JWT_SECRET=superpasswordgiganteobrigatoriacom32digitosnoMinimo!
JWT_EXPIRES_IN=8h
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001

# DATABASE DEFAULT PARA SQL SERVER LOCAL
DATABASE_URL="sqlserver://localhost:1433;database=portal_aegea;integratedSecurity=true;trustServerCertificate=true"

# Defina as credenciais para logar na tela Administrativa local baseadas no arquivo MOCK de frontend
MOCK_ADMIN_PASSWORD=admin123
MOCK_EDITOR_PASSWORD=editor123
MOCK_VIEWER_PASSWORD=viewer123

# Se 'dataverse', ativará a feature "Sincronizar" real pro servidor Dataverse.
# Se 'local', os dados do Dashboard virão estátivos (mock embutido p/ teste visual)
COE_DATA_SOURCE=local

# NECESSÁRIO EM PROD: As chaves do Portal AEGEA do Azure para consumir o Dynamics Dataverse (Entra)
DATAVERSE_URL=https://aegea-coe.crm2.dynamics.com
DATAVERSE_TENANT_ID=xxxx
DATAVERSE_CLIENT_ID=yyyy
DATAVERSE_CLIENT_SECRET=zzzz
```

## 📖 Rotas Opcionais e Documentação Open API
Rodando em modo desenvolvimento, toda a API possui cobertura documentada utilizando o Swagger. Você pode acessar sua documentação automática em:
[http://localhost:4000/api/docs](http://localhost:4000/api/docs)