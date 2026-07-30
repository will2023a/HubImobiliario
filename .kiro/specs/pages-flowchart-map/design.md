# Documento de Design Técnico — CRM Imobiliário SaaS

## Overview

Este documento define a arquitetura técnica completa do CRM Imobiliário SaaS, cobrindo tanto a modernização das páginas existentes quanto o design dos novos módulos (Pipeline, Inbox, IA, Automações, Agenda, Marketing Digital, Financeiro, Analytics). O sistema é multi-tenant, baseado em hierarquia de roles e opera como plataforma SaaS para imobiliárias.

### Princípios de Design

1. **Multi-tenancy estrito**: Isolamento total de dados por `imobiliariaId` em todas as camadas
2. **Role-based access hierárquico**: super_admin → admin_imobiliaria → diretor → gerente → corretor
3. **Real-time first**: WebSocket para inbox, notificações e atualizações de pipeline
4. **Modularidade**: Módulos independentes com interfaces bem definidas
5. **Extensibilidade por fases**: Cada módulo pode ser implementado e implantado independentemente

### Stack Tecnológica Atualizada

| Camada | Atual | Adição |
|--------|-------|--------|
| Frontend | React 18, Parcel, React Router 6 | React Flow, DnD Kit, Chart.js, Socket.io Client |
| Backend | Express 4.18, Prisma 5, MySQL | Socket.io, BullMQ, Redis, MinIO S3 |
| IA | — | OpenAI GPT-4 / Claude API |
| Comunicação | — | Evolution API (WhatsApp), Meta Graph API |
| Infraestrutura | — | Redis, MinIO, Nginx, Docker |


---

## Architecture

### Diagrama de Alto Nível

```mermaid
graph TB
    subgraph Frontend["Frontend (React SPA)"]
        Router[React Router v6]
        Pages[Pages/Views]
        Components[Design System]
        State[Context + Hooks]
        WSClient[Socket.io Client]
    end

    subgraph Backend["Backend (Node.js)"]
        Express[Express API Server]
        WSServer[Socket.io Server]
        Auth[JWT Auth + RBAC Middleware]
        MultiTenant[Multi-Tenant Middleware]
        Services[Service Layer]
    end

    subgraph Workers["Background Workers"]
        BullMQ[BullMQ Queues]
        AutoEngine[Automation Engine]
        AIWorker[AI Worker]
        SyncWorker[Sync Worker]
    end

    subgraph External["Serviços Externos"]
        MySQL[(MySQL - Prisma)]
        Redis[(Redis)]
        MinIO[(MinIO/S3)]
        OpenAI[OpenAI/Claude API]
        Evolution[Evolution API - WhatsApp]
        MetaAPI[Meta Graph API]
        Google[Google Calendar API]
    end

    Frontend -->|REST API| Backend
    Frontend -->|WebSocket| WSServer
    Backend --> MySQL
    Backend --> Redis
    Backend --> MinIO
    Backend --> BullMQ
    Workers --> MySQL
    Workers --> Redis
    Workers --> OpenAI
    Workers --> Evolution
    Workers --> MetaAPI
    Workers --> Google
```


### Arquitetura de Camadas

```mermaid
graph LR
    subgraph Presentation["Camada de Apresentação"]
        UI[React Components]
        Hooks[Custom Hooks]
        Context[Auth/Socket Context]
    end

    subgraph Application["Camada de Aplicação"]
        Routes[Express Routes]
        Middleware[Auth + RBAC + Tenant]
        Controllers[Controllers]
    end

    subgraph Domain["Camada de Domínio"]
        ServiceLayer[Services]
        BusinessRules[Business Rules]
        Validators[Validators]
    end

    subgraph Infrastructure["Camada de Infraestrutura"]
        Prisma[Prisma ORM]
        RedisClient[Redis Client]
        S3Client[MinIO Client]
        QueueClient[BullMQ]
        ExternalAPIs[APIs Externas]
    end

    Presentation --> Application
    Application --> Domain
    Domain --> Infrastructure
```

### Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| State Management | React Context + Custom Hooks | Complexidade adequada sem overhead de Redux; Socket.io context para real-time |
| Real-time | Socket.io | Suporte a rooms (por imobiliária), reconexão automática, fallback para polling |
| Job Queue | BullMQ + Redis | Melhor suporte a retries, scheduling, prioridades e dashboard de monitoramento |
| File Storage | MinIO (S3-compatible) | Self-hosted, API compatível com AWS S3, sem vendor lock-in |
| AI Provider | OpenAI (primary) + Claude (fallback) | GPT-4 para atendimento, Claude para análise longa de dados |
| WhatsApp | Evolution API | Open-source, self-hosted, suporte a multi-device |
| Bundler | Parcel (manter) | Já em uso, zero-config, adequado para o tamanho do projeto |
| Charts | Chart.js + react-chartjs-2 | Leve, responsivo, boa documentação, sem necessidade de D3 |
| Drag & Drop | @dnd-kit | Moderno, acessível, performático para Kanban e Agenda |
| Flow Editor | React Flow | Líder para editores visuais de fluxo (automações) |

---


## Components and Interfaces

### Frontend — Estrutura de Diretórios (Proposta)

```
frontend/src/
├── App.jsx
├── main.jsx
├── components/
│   ├── layout/
│   │   ├── Layout.jsx          (refatorado: seções + busca + notificações)
│   │   ├── Sidebar.jsx         (novo: sidebar com seções colapsáveis)
│   │   ├── Header.jsx          (novo: busca global + notificações + perfil)
│   │   └── Layout.css
│   ├── ui/                     (Design System)
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   ├── Table.jsx
│   │   ├── Spinner.jsx
│   │   ├── Toast.jsx
│   │   ├── Dropdown.jsx
│   │   ├── Tooltip.jsx
│   │   ├── Pagination.jsx
│   │   ├── Tabs.jsx
│   │   ├── Avatar.jsx
│   │   ├── EmptyState.jsx
│   │   └── index.js            (barrel export)
│   ├── shared/
│   │   ├── SearchGlobal.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── KPICard.jsx
│   │   └── FileUpload.jsx
│   └── features/
│       ├── pipeline/
│       │   ├── KanbanBoard.jsx
│       │   ├── KanbanColumn.jsx
│       │   ├── LeadCard.jsx
│       │   └── LeadSidePanel.jsx
│       ├── inbox/
│       │   ├── ConversationList.jsx
│       │   ├── ChatArea.jsx
│       │   ├── MessageInput.jsx
│       │   ├── ContactPanel.jsx
│       │   └── AISuggestions.jsx
│       ├── automations/
│       │   ├── FlowCanvas.jsx
│       │   ├── NodePalette.jsx
│       │   ├── NodeConfig.jsx
│       │   └── nodes/ (TriggerNode, ConditionNode, ActionNode, WaitNode, AINode)
│       ├── agenda/
│       │   ├── Calendar.jsx
│       │   ├── EventCard.jsx
│       │   └── EventForm.jsx
│       └── analytics/
│           ├── FunnelChart.jsx
│           ├── TimelineChart.jsx
│           └── RankingTable.jsx
├── contexts/
│   ├── AuthContext.jsx         (existente)
│   ├── SocketContext.jsx       (novo: WebSocket connection)
│   ├── NotificationContext.jsx (novo: real-time notifications)
│   └── ThemeContext.jsx        (novo: dark/light theme)
├── hooks/
│   ├── useSocket.js
│   ├── useNotifications.js
│   ├── usePagination.js
│   ├── useDebounce.js
│   └── usePermission.js
├── pages/                      (organizado por módulo)
│   ├── auth/
│   ├── dashboard/
│   ├── crm/                    (Pipeline, Leads, Tarefas)
│   ├── inbox/
│   ├── imoveis/                (Empreendimentos, Imóveis, Propostas, Visitas)
│   ├── marketing/
│   ├── automations/
│   ├── agenda/
│   ├── financeiro/
│   ├── analytics/
│   ├── admin/                  (Equipe, Permissões, Config, Auditoria)
│   └── super/
├── services/
│   ├── api.js                  (existente - axios instance)
│   ├── socket.js               (novo - socket.io client)
│   └── storage.js              (novo - file upload service)
└── styles/
    ├── global.css
    ├── variables.css            (CSS custom properties - design tokens)
    └── themes/
        ├── dark.css
        └── light.css
```


### Backend — Estrutura de Diretórios (Proposta)

```
backend/src/
├── app.js                      (existente - expandir)
├── server.js                   (existente - adicionar socket.io)
├── socket.js                   (novo - WebSocket server setup)
├── middlewares/
│   ├── auth.js                 (existente)
│   ├── multitenant.js          (existente)
│   ├── permissions.js          (existente)
│   ├── roles.js                (existente)
│   ├── rateLimit.js            (novo)
│   └── upload.js               (novo - multer + MinIO)
├── routes/
│   ├── (existentes 13 routes)
│   ├── pipeline.js             (novo)
│   ├── inbox.js                (novo)
│   ├── conversations.js        (novo)
│   ├── automations.js          (novo)
│   ├── agenda.js               (novo)
│   ├── tasks.js                (novo)
│   ├── campaigns.js            (novo)
│   ├── landingPages.js         (novo)
│   ├── comissoes.js            (novo)
│   ├── contratos.js            (novo)
│   ├── analytics.js            (novo)
│   ├── notifications.js        (novo)
│   ├── templates.js            (novo)
│   ├── filas.js                (novo)
│   ├── search.js               (novo)
│   ├── ai.js                   (novo)
│   ├── audit.js                (novo)
│   ├── webhooks.js             (novo)
│   ├── config.js               (novo)
│   └── upload.js               (novo)
├── services/
│   ├── ai.service.js           (novo - OpenAI/Claude abstraction)
│   ├── whatsapp.service.js     (novo - Evolution API client)
│   ├── meta.service.js         (novo - Instagram/Facebook)
│   ├── email.service.js        (novo - SMTP/IMAP)
│   ├── notification.service.js (novo - push + in-app)
│   ├── automation.service.js   (novo - flow execution engine)
│   ├── commission.service.js   (novo - cálculo de comissões)
│   ├── queue.service.js        (novo - lead distribution)
│   ├── search.service.js       (novo - full-text + AI search)
│   ├── calendar.service.js     (novo - Google Calendar sync)
│   └── storage.service.js      (novo - MinIO/S3 operations)
├── workers/
│   ├── automation.worker.js    (novo - BullMQ processor)
│   ├── ai.worker.js            (novo - AI tasks processor)
│   ├── notification.worker.js  (novo - send notifications)
│   ├── sync.worker.js          (novo - external sync jobs)
│   └── report.worker.js        (novo - report generation)
├── prisma/
│   └── client.js               (existente)
└── utils/
    ├── jwt.js                  (existente)
    ├── validators.js           (existente)
    ├── permissions.util.js     (novo - permission evaluation)
    └── pipeline.util.js        (novo - stage transition rules)
```


### Interfaces Principais

#### API REST — Novos Endpoints

```
# Pipeline CRM
GET    /pipeline/stages               - Listar estágios configurados
POST   /pipeline/stages               - Criar/reordenar estágios
PUT    /pipeline/leads/:id/stage      - Mover lead entre estágios (drag & drop)
GET    /pipeline/leads                - Leads no pipeline (com filtros)

# Inbox / Conversas
GET    /conversations                 - Listar conversas (filtros: canal, status, corretor)
GET    /conversations/:id/messages    - Mensagens de uma conversa
POST   /conversations/:id/messages    - Enviar mensagem
PUT    /conversations/:id/assign      - Transferir conversa
PUT    /conversations/:id/status      - Alterar status (aberta/resolvida)

# Automações
GET    /automations                   - Listar fluxos
POST   /automations                   - Criar fluxo
PUT    /automations/:id               - Atualizar fluxo (nós + conexões)
PUT    /automations/:id/toggle        - Ativar/desativar
POST   /automations/:id/test          - Executar com dados simulados

# Agenda
GET    /agenda/events                 - Listar eventos (período + tipo)
POST   /agenda/events                 - Criar evento
PUT    /agenda/events/:id             - Atualizar evento (inclui reagendar)
DELETE /agenda/events/:id             - Cancelar evento
POST   /agenda/sync/google           - Sincronizar Google Calendar

# Tarefas
GET    /tasks                         - Listar tarefas (filtros: tipo, status, lead)
POST   /tasks                         - Criar tarefa
PUT    /tasks/:id                     - Atualizar tarefa
PUT    /tasks/:id/complete            - Marcar como concluída

# Campanhas Marketing
GET    /campaigns                     - Listar campanhas
POST   /campaigns                     - Criar campanha
GET    /campaigns/:id/metrics         - Métricas da campanha

# Landing Pages
GET    /landing-pages                 - Listar landing pages
POST   /landing-pages                 - Criar landing page
PUT    /landing-pages/:id             - Atualizar
POST   /landing-pages/:id/publish     - Publicar
POST   /landing-pages/:slug/submit    - Captura de lead (público)

# Financeiro
GET    /comissoes                     - Listar comissões (filtros)
PUT    /comissoes/:id/pagar           - Marcar como paga
GET    /contratos                     - Listar contratos
POST   /contratos/from-proposta/:id   - Gerar contrato de proposta
PUT    /contratos/:id/enviar          - Enviar para assinatura

# Analytics
GET    /analytics/dashboard           - Dados do dashboard BI
GET    /analytics/funnel              - Dados do funil
GET    /analytics/ranking             - Ranking de corretores
GET    /analytics/forecasting         - Previsões IA
POST   /analytics/reports/export      - Exportar relatório

# Notificações
GET    /notifications                 - Listar notificações
PUT    /notifications/:id/read        - Marcar como lida
PUT    /notifications/read-all        - Marcar todas como lidas

# Busca Global
GET    /search?q=termo               - Busca unificada
GET    /search/ai?q=linguagem_natural - Busca com IA

# Templates
GET    /templates                     - Listar templates
POST   /templates                     - Criar template
GET    /templates/:id/render/:leadId  - Renderizar com variáveis do lead

# Filas
GET    /filas                         - Listar filas configuradas
POST   /filas                         - Criar fila
PUT    /filas/:id                     - Atualizar regras

# Configurações
GET    /config                        - Dados de configuração
PUT    /config                        - Atualizar configuração
GET    /config/channels               - Status dos canais
POST   /config/channels/whatsapp      - Conectar WhatsApp
POST   /config/channels/meta          - Conectar Meta

# Auditoria
GET    /audit                         - Listar logs (filtros)
POST   /audit/export                  - Exportar logs

# Webhooks
GET    /webhooks                      - Listar webhooks
POST   /webhooks                      - Criar webhook
DELETE /webhooks/:id                  - Remover webhook
GET    /webhooks/:id/deliveries       - Log de entregas

# Upload
POST   /upload                        - Upload de arquivo
DELETE /upload/:key                   - Remover arquivo
```


#### WebSocket Events

```
# Server → Client
notification:new           - Nova notificação
conversation:message       - Nova mensagem no inbox
conversation:status        - Status da conversa mudou
pipeline:lead-moved        - Lead movido no pipeline (outro usuário)
pipeline:lead-updated      - Dados do lead atualizados
presence:user-online       - Usuário ficou online
presence:user-offline      - Usuário ficou offline

# Client → Server
conversation:join          - Entrar na room de uma conversa
conversation:leave         - Sair da room
conversation:typing        - Indicador de digitação
pipeline:subscribe         - Inscrever-se em atualizações do pipeline
```

#### Socket.io Rooms Strategy

```
imobiliaria:{id}           - Todos os eventos da imobiliária
user:{id}                  - Eventos pessoais (notificações)
conversation:{id}          - Mensagens de uma conversa específica
pipeline:{imobiliariaId}   - Atualizações do pipeline
```

---


## Data Models

### Novos Modelos Prisma

```prisma
// ===== PIPELINE CRM =====

model PipelineStage {
  id            Int           @id @default(autoincrement())
  nome          String
  ordem         Int
  cor           String        @default("#3b82f6")
  imobiliariaId Int
  imobiliaria   Imobiliaria   @relation(fields: [imobiliariaId], references: [id])
  leads         LeadPipeline[]
  createdAt     DateTime      @default(now())

  @@unique([imobiliariaId, ordem])
}

model LeadPipeline {
  id            Int           @id @default(autoincrement())
  leadId        Int           @unique
  lead          Lead          @relation(fields: [leadId], references: [id])
  stageId       Int
  stage         PipelineStage @relation(fields: [stageId], references: [id])
  temperatura   String        @default("morno") // quente, morno, frio
  valorPotencial Float?
  enteredStageAt DateTime     @default(now())
  updatedAt     DateTime      @updatedAt
}

// ===== INBOX / CONVERSAS =====

model Conversation {
  id            Int           @id @default(autoincrement())
  canal         String        // whatsapp, instagram, facebook, email, chat
  status        String        @default("aberta") // aberta, pendente, resolvida
  externalId    String?       // ID externo (WhatsApp message ID, etc)
  contactName   String
  contactPhone  String?
  contactEmail  String?
  leadId        Int?
  lead          Lead?         @relation(fields: [leadId], references: [id])
  assignedToId  Int?
  assignedTo    User?         @relation("ConversationAssigned", fields: [assignedToId], references: [id])
  imobiliariaId Int
  imobiliaria   Imobiliaria   @relation(fields: [imobiliariaId], references: [id])
  messages      Message[]
  lastMessageAt DateTime      @default(now())
  createdAt     DateTime      @default(now())

  @@index([imobiliariaId, status])
  @@index([imobiliariaId, canal])
}

model Message {
  id              Int          @id @default(autoincrement())
  conversationId  Int
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  direction       String       // inbound, outbound
  content         String       @db.Text
  contentType     String       @default("text") // text, image, audio, document
  mediaUrl        String?
  status          String       @default("sent") // sent, delivered, read, failed
  senderName      String?
  isAI            Boolean      @default(false)
  createdAt       DateTime     @default(now())
}

// ===== AUTOMAÇÕES =====

model Automation {
  id            Int              @id @default(autoincrement())
  nome          String
  status        String           @default("rascunho") // rascunho, ativo, inativo
  gatilho       String           // novo_lead, lead_mudou_estagio, mensagem_recebida, tempo, data
  imobiliariaId Int
  imobiliaria   Imobiliaria      @relation(fields: [imobiliariaId], references: [id])
  nodes         Json             // Array de nós do fluxo (React Flow format)
  edges         Json             // Array de conexões entre nós
  executions    AutomationExec[]
  lastRunAt     DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}

model AutomationExec {
  id            Int        @id @default(autoincrement())
  automationId  Int
  automation    Automation @relation(fields: [automationId], references: [id])
  leadId        Int?
  status        String     // running, success, failed
  logs          Json?      // Log de execução por nó
  startedAt     DateTime   @default(now())
  completedAt   DateTime?
}

// ===== AGENDA / TAREFAS =====

model AgendaEvent {
  id            Int         @id @default(autoincrement())
  titulo        String
  descricao     String?     @db.Text
  tipo          String      // visita, tarefa, evento, lembrete
  dataInicio    DateTime
  dataFim       DateTime?
  allDay        Boolean     @default(false)
  userId        Int
  user          User        @relation("UserEvents", fields: [userId], references: [id])
  leadId        Int?
  lead          Lead?       @relation(fields: [leadId], references: [id])
  googleEventId String?     // ID do Google Calendar
  lembrete      Int?        // minutos antes
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Task {
  id            Int         @id @default(autoincrement())
  titulo        String
  descricao     String?     @db.Text
  tipo          String      // follow_up, ligacao, visita, documentacao, outro
  prioridade    String      @default("media") // baixa, media, alta
  status        String      @default("pendente") // pendente, concluida, atrasada
  prazo         DateTime
  concluidaEm   DateTime?
  userId        Int
  user          User        @relation("UserTasks", fields: [userId], references: [id])
  leadId        Int?
  lead          Lead?       @relation("LeadTasks", fields: [leadId], references: [id])
  automationId  Int?        // Se criada por automação
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())
}
```


```prisma
// ===== MARKETING DIGITAL =====

model Campaign {
  id            Int         @id @default(autoincrement())
  nome          String
  plataforma    String      // meta_ads, google_ads
  status        String      @default("rascunho") // rascunho, ativa, pausada, encerrada
  budget        Float?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  dataInicio    DateTime?
  dataFim       DateTime?
  impressoes    Int         @default(0)
  cliques       Int         @default(0)
  leadsGerados  Int         @default(0)
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model LandingPage {
  id               Int         @id @default(autoincrement())
  titulo           String
  slug             String      @unique
  status           String      @default("rascunho") // rascunho, publicada
  blocks           Json        // Blocos do builder visual
  empreendimentoId Int?
  empreendimento   Empreendimento? @relation(fields: [empreendimentoId], references: [id])
  visitas          Int         @default(0)
  conversoes       Int         @default(0)
  imobiliariaId    Int
  imobiliaria      Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}

// ===== FINANCEIRO =====

model Comissao {
  id            Int         @id @default(autoincrement())
  propostaId    Int
  proposta      Proposta    @relation(fields: [propostaId], references: [id])
  userId        Int
  user          User        @relation("UserComissoes", fields: [userId], references: [id])
  role          String      // role do usuário no momento do cálculo
  percentual    Float       // % da comissão
  valorVenda    Float       // valor total da venda
  valorComissao Float       // valor calculado da comissão
  status        String      @default("pendente") // pendente, paga
  dataPagamento DateTime?
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())
}

model Contrato {
  id            Int         @id @default(autoincrement())
  propostaId    Int         @unique
  proposta      Proposta    @relation(fields: [propostaId], references: [id])
  status        String      @default("rascunho") // rascunho, enviado, assinado, cancelado
  templateId    String?
  documentUrl   String?     // URL do PDF gerado
  assinadoEm    DateTime?
  enviadoEm     DateTime?
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

// ===== CONFIGURAÇÕES =====

model ConfigImobiliaria {
  id                 Int         @id @default(autoincrement())
  imobiliariaId      Int         @unique
  imobiliaria        Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  logoUrl            String?
  corPrimaria        String      @default("#6366f1")
  corSecundaria      String      @default("#8b5cf6")
  tema               String      @default("dark") // dark, light
  horarioInicio      String      @default("08:00")
  horarioFim         String      @default("18:00")
  diasUteis          Json        @default("[1,2,3,4,5]") // 0=dom, 6=sab
  iaAtiva            Boolean     @default(false)
  iaPrompt           String?     @db.Text
  iaHorasAuto        Boolean     @default(false) // responder fora do horário
  iaLimiteTokensMes  Int         @default(100000)
  comissaoCorretor   Float       @default(3.0) // %
  comissaoGerente    Float       @default(1.0) // %
  comissaoDiretor    Float       @default(0.5) // %
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
}

// ===== NOTIFICAÇÕES =====

model Notification {
  id            Int         @id @default(autoincrement())
  userId        Int
  user          User        @relation("UserNotifications", fields: [userId], references: [id])
  tipo          String      // nova_mensagem, nova_proposta, proposta_aprovada, lead_atribuido, lembrete_tarefa
  titulo        String
  mensagem      String
  lida          Boolean     @default(false)
  link          String?     // URL de destino ao clicar
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())

  @@index([userId, lida])
}

// ===== TEMPLATES =====

model MessageTemplate {
  id            Int         @id @default(autoincrement())
  nome          String
  categoria     String      // boas_vindas, follow_up, agendamento, proposta, documentacao
  conteudo      String      @db.Text // Com variáveis {{nome_lead}}, {{empreendimento}}, etc
  canal         String      @default("todos") // whatsapp, email, todos
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

// ===== FILAS DE ATENDIMENTO =====

model AtendimentoQueue {
  id            Int         @id @default(autoincrement())
  nome          String
  regra         String      // round_robin, performance, disponibilidade
  canal         String?     // whatsapp, instagram (null = todos)
  empreendimentoId Int?
  imobiliariaId Int
  imobiliaria   Imobiliaria @relation(fields: [imobiliariaId], references: [id])
  membros       QueueMember[]
  createdAt     DateTime    @default(now())
}

model QueueMember {
  id            Int              @id @default(autoincrement())
  queueId       Int
  queue         AtendimentoQueue @relation(fields: [queueId], references: [id])
  userId        Int
  user          User             @relation("QueueMembers", fields: [userId], references: [id])
  disponivel    Boolean          @default(true)
  ultimoLead    DateTime?        // Para round-robin
  leadsAtivos   Int              @default(0) // Para balanceamento por carga

  @@unique([queueId, userId])
}

// ===== AUDITORIA =====

model AuditLog {
  id            Int         @id @default(autoincrement())
  userId        Int
  user          User        @relation("UserAuditLogs", fields: [userId], references: [id])
  acao          String      // login, criar, editar, deletar, aprovar, rejeitar
  recurso       String      // lead, proposta, empreendimento, usuario, permissao
  recursoId     Int?
  detalhes      Json?       // Campos alterados, valores anteriores
  ip            String?
  imobiliariaId Int?
  imobiliaria   Imobiliaria? @relation(fields: [imobiliariaId], references: [id])
  createdAt     DateTime    @default(now())

  @@index([imobiliariaId, createdAt])
  @@index([userId, createdAt])
}

// ===== WEBHOOKS =====

model Webhook {
  id            Int              @id @default(autoincrement())
  url           String
  eventos       Json             // Array de eventos assinados
  secretKey     String
  ativo         Boolean          @default(true)
  imobiliariaId Int
  imobiliaria   Imobiliaria      @relation(fields: [imobiliariaId], references: [id])
  deliveries    WebhookDelivery[]
  createdAt     DateTime         @default(now())
}

model WebhookDelivery {
  id         Int      @id @default(autoincrement())
  webhookId  Int
  webhook    Webhook  @relation(fields: [webhookId], references: [id])
  evento     String
  payload    Json
  statusCode Int?
  response   String?  @db.Text
  sucesso    Boolean
  createdAt  DateTime @default(now())
}
```


### Diagrama de Relações dos Novos Modelos

```mermaid
erDiagram
    Lead ||--o| LeadPipeline : "pipeline state"
    Lead ||--o{ Conversation : "inbox conversations"
    Lead ||--o{ Task : "tasks/follow-ups"
    Lead ||--o{ AgendaEvent : "events"
    
    PipelineStage ||--o{ LeadPipeline : "leads in stage"
    Imobiliaria ||--o{ PipelineStage : "custom stages"
    
    Conversation ||--o{ Message : "messages"
    User ||--o{ Conversation : "assigned conversations"
    
    Imobiliaria ||--o{ Automation : "automation flows"
    Automation ||--o{ AutomationExec : "executions"
    
    User ||--o{ AgendaEvent : "calendar events"
    User ||--o{ Task : "assigned tasks"
    
    Imobiliaria ||--o{ Campaign : "marketing campaigns"
    Imobiliaria ||--o{ LandingPage : "landing pages"
    Empreendimento ||--o{ LandingPage : "linked pages"
    
    Proposta ||--o{ Comissao : "commissions"
    Proposta ||--|| Contrato : "contract"
    User ||--o{ Comissao : "earned commissions"
    
    Imobiliaria ||--|| ConfigImobiliaria : "settings"
    User ||--o{ Notification : "notifications"
    
    Imobiliaria ||--o{ AtendimentoQueue : "queues"
    AtendimentoQueue ||--o{ QueueMember : "members"
    
    User ||--o{ AuditLog : "actions log"
    Imobiliaria ||--o{ Webhook : "webhooks"
    Webhook ||--o{ WebhookDelivery : "deliveries"
```

### Alterações nos Modelos Existentes

```prisma
// Adicionar ao model User:
  conversations   Conversation[]    @relation("ConversationAssigned")
  events          AgendaEvent[]     @relation("UserEvents")
  tasks           Task[]            @relation("UserTasks")
  comissoes       Comissao[]        @relation("UserComissoes")
  notifications   Notification[]    @relation("UserNotifications")
  queueMembros    QueueMember[]     @relation("QueueMembers")
  auditLogs       AuditLog[]        @relation("UserAuditLogs")

// Adicionar ao model Lead:
  pipeline        LeadPipeline?
  conversations   Conversation[]
  events          AgendaEvent[]
  tasks           Task[]            @relation("LeadTasks")
  campanhaId      Int?              // Lead veio de qual campanha
  temperatura     String?           @default("morno")
  tags            Json?             // Array de tags

// Adicionar ao model Imobiliaria:
  pipelineStages  PipelineStage[]
  conversations   Conversation[]
  automations     Automation[]
  events          AgendaEvent[]
  tasks           Task[]
  campaigns       Campaign[]
  landingPages    LandingPage[]
  comissoes       Comissao[]
  contratos       Contrato[]
  config          ConfigImobiliaria?
  notifications   Notification[]
  templates       MessageTemplate[]
  queues          AtendimentoQueue[]
  auditLogs       AuditLog[]
  webhooks        Webhook[]

// Adicionar ao model Proposta:
  comissoes       Comissao[]
  contrato        Contrato?

// Adicionar ao model Empreendimento:
  landingPages    LandingPage[]
```

---


## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de corretude verificáveis por máquina.*

### Property 1: Redirecionamento por Role após Login

*Para qualquer* usuário válido com qualquer role (super_admin, admin_imobiliaria, diretor, gerente, corretor), após login bem-sucedido, o sistema deve redirecionar para o path de dashboard correto correspondente ao role (super_admin → /super, demais → /dashboard).

**Validates: Requirements 1.2**

### Property 2: Validação de Campos Obrigatórios no Cadastro

*Para qualquer* subconjunto de campos obrigatórios deixados vazios no formulário de cadastro de imobiliária, o sistema deve exibir erro de validação especificamente nos campos ausentes e bloquear o envio.

**Validates: Requirements 2.4**

### Property 3: KPIs Filtrados por Role

*Para qualquer* usuário com qualquer role, os cards de KPI exibidos no Dashboard Home devem conter apenas métricas permitidas para aquele role — corretor vê apenas métricas próprias, gerente vê métricas de subordinados, etc.

**Validates: Requirements 4.1, 4.5**


### Property 4: Criação de Proposta Reserva a Unidade

*Para qualquer* unidade com status "disponivel" e qualquer proposta válida criada para essa unidade, o sistema deve alterar o status da unidade para "reservado" atomicamente.

**Validates: Requirements 9.4**

### Property 5: Invariante de Estoque na Dispensação de Material

*Para qualquer* material com estoque X e qualquer quantidade N a dispensar: se N > X a operação deve ser rejeitada e o estoque permanece inalterado; se N <= X a operação deve ser aceita e o estoque deve diminuir exatamente N unidades (estoque_final = X - N).

**Validates: Requirements 14.3, 14.4**

### Property 6: Transição de Estágio no Pipeline

*Para qualquer* lead em qualquer estágio do pipeline, ao ser movido para outro estágio válido, o status do lead deve ser atualizado automaticamente para corresponder ao nome/tipo do estágio destino, e o campo `enteredStageAt` deve ser atualizado para o timestamp atual.

**Validates: Requirements 25.3**

### Property 7: Vinculação Automática de Conversa a Lead

*Para qualquer* conversa recebida com um número de telefone ou e-mail que corresponda a um lead existente na mesma imobiliária, o sistema deve vincular automaticamente a conversa ao lead (definir `leadId`).

**Validates: Requirements 26.10**

### Property 8: Validação de Fluxo de Automação

*Para qualquer* grafo de automação, a validação deve garantir: (1) existe exatamente um nó do tipo Gatilho, (2) todas as edges conectam nós existentes, (3) não existem nós desconectados (sem edges de entrada ou saída, exceto o gatilho que não tem entrada e nós terminais que não têm saída).

**Validates: Requirements 30.5**


### Property 9: Cálculo de Comissão

*Para qualquer* proposta aprovada com valor de venda V e qualquer configuração de percentuais de comissão (corretor: Pc%, gerente: Pg%, diretor: Pd%), o sistema deve gerar comissões onde: comissão_corretor = V * Pc / 100, comissão_gerente = V * Pg / 100, comissão_diretor = V * Pd / 100.

**Validates: Requirements 34.2, 34.6**

### Property 10: Busca Global Retorna Resultados Corretos

*Para qualquer* entidade (lead, imóvel, empreendimento, proposta) que contenha o termo buscado em qualquer um dos campos pesquisáveis (nome, telefone, e-mail, endereço, CPF), a busca global deve incluir essa entidade nos resultados, respeitando o escopo de visibilidade do role do usuário.

**Validates: Requirements 41.3**

### Property 11: Substituição de Variáveis em Templates

*Para qualquer* template contendo placeholders {{variavel}} e qualquer lead com dados correspondentes, ao renderizar o template, todas as variáveis devem ser substituídas pelos valores reais do lead, e nenhum placeholder {{...}} deve permanecer na saída final.

**Validates: Requirements 43.4**

### Property 12: Distribuição Round-Robin na Fila

*Para qualquer* fila com N membros disponíveis usando regra round-robin, após N atribuições consecutivas de leads, cada membro deve ter recebido exatamente 1 lead. Após 2N atribuições, cada membro deve ter recebido exatamente 2 leads.

**Validates: Requirements 44.4**

### Property 13: Sidebar Filtra por Permissão de Role

*Para qualquer* usuário com qualquer role, todos os itens visíveis na sidebar devem ter aquele role em sua lista de roles permitidos, e nenhum item oculto deve incluir aquele role em sua lista de roles permitidos.

**Validates: Requirements 49.2**

### Property 14: Acessibilidade de Contraste em Badges

*Para qualquer* tipo de status e suas cores configuradas (foreground/background), o ratio de contraste deve ser >= 4.5:1 conforme WCAG AA, garantindo legibilidade para usuários com deficiência visual.

**Validates: Requirements 50.5**

---


## Error Handling

### Estratégia Geral

| Camada | Estratégia | Exemplo |
|--------|-----------|---------|
| Frontend | Toast notifications + inline validation | Erro de validação em forms, falha de API |
| API REST | HTTP status codes + mensagens estruturadas | 400/401/403/404/422/500 com `{ error, message, details }` |
| WebSocket | Evento de erro + reconexão automática | `error` event + exponential backoff |
| Background Jobs | Retry com backoff + dead letter queue | BullMQ retry 3x, notifica admin em falha definitiva |
| Integrações | Circuit breaker + fallback | Evolution API offline → enfileirar mensagem |

### Padrão de Resposta de Erro da API

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos no formulário",
  "details": [
    { "field": "email", "message": "E-mail já cadastrado" },
    { "field": "cnpj", "message": "CNPJ com formato inválido" }
  ]
}
```

### Códigos HTTP Utilizados

| Código | Uso |
|--------|-----|
| 200 | Sucesso (GET, PUT) |
| 201 | Criado com sucesso (POST) |
| 400 | Dados inválidos / validação falhou |
| 401 | Não autenticado (token expirado/ausente) |
| 403 | Sem permissão (role insuficiente) |
| 404 | Recurso não encontrado |
| 409 | Conflito (e.g., e-mail duplicado, unidade já reservada) |
| 422 | Entidade não processável (regra de negócio violada) |
| 429 | Rate limit atingido |
| 500 | Erro interno do servidor |

### Cenários de Erro Específicos

| Cenário | Ação | Feedback |
|---------|------|----------|
| Token JWT expirado | Redirect para /login | Toast "Sessão expirada" |
| Permissão negada | Bloqueia ação | Toast "Sem permissão" |
| WebSocket desconectado | Retry exponential backoff | Indicador visual "Reconectando..." |
| WhatsApp API offline | Enfileira mensagem no BullMQ | Toast "Mensagem será enviada quando conexão restaurar" |
| IA falhou (timeout/rate limit) | Fallback para operação manual | Toast "IA indisponível, tente novamente" |
| Upload falhou | Retry 1x, depois reporta | Toast "Falha no upload, tente novamente" |
| Estoque insuficiente | Bloqueia dispensação | Inline error "Quantidade excede estoque disponível (X unidades)" |
| Unidade já reservada | Bloqueia proposta | Modal "Esta unidade já foi reservada por outro corretor" |
| Fluxo de automação inválido | Destaca nós com erro | Inline errors nos nós problemáticos |

### Logging e Monitoramento

- **Erros 5xx**: Log completo com stack trace + alerta para time de desenvolvimento
- **Erros 4xx repetitivos**: Log de pattern (possível ataque ou bug de frontend)
- **WebSocket disconnects**: Métricas de uptime por usuário
- **Job failures**: Dashboard do BullMQ com contadores de falha por fila
- **External API errors**: Circuit breaker status + últimos erros

---


## Testing Strategy

### Abordagem Dual

O sistema será testado com duas estratégias complementares:

1. **Testes Unitários (example-based)**: Verificam comportamentos específicos, edge cases e integrações
2. **Testes de Propriedade (property-based)**: Verificam invariantes universais para todas as entradas válidas

### Biblioteca de Property-Based Testing

- **Backend**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript/TypeScript)
- **Configuração**: Mínimo 100 iterações por propriedade
- **Tag format**: `Feature: pages-flowchart-map, Property {N}: {título}`

### Mapeamento de Testes por Propriedade

| Property | Módulo | Tipo de Teste | Iterações |
|----------|--------|---------------|-----------|
| 1: Redirecionamento por Role | Auth | Property (fast-check) | 100 |
| 2: Validação Campos Obrigatórios | Forms | Property (fast-check) | 100 |
| 3: KPIs por Role | Dashboard | Property (fast-check) | 100 |
| 4: Proposta Reserva Unidade | Propostas | Property (fast-check) | 100 |
| 5: Invariante de Estoque | Marketing | Property (fast-check) | 100 |
| 6: Transição Pipeline | Pipeline | Property (fast-check) | 100 |
| 7: Vinculação Conversa-Lead | Inbox | Property (fast-check) | 100 |
| 8: Validação Fluxo Automação | Automações | Property (fast-check) | 100 |
| 9: Cálculo de Comissão | Financeiro | Property (fast-check) | 100 |
| 10: Busca Global | Search | Property (fast-check) | 100 |
| 11: Substituição Templates | Templates | Property (fast-check) | 100 |
| 12: Distribuição Round-Robin | Filas | Property (fast-check) | 100 |
| 13: Sidebar por Role | Layout | Property (fast-check) | 100 |
| 14: Contraste WCAG AA | Design System | Property (fast-check) | 100 |

### Testes Unitários (Example-Based)

| Área | Exemplos de Teste |
|------|-------------------|
| Auth | Login com credenciais válidas/inválidas, token expirado, refresh |
| Forms | Validação de CNPJ, e-mail único, senha mínima |
| Pipeline | Drag & drop move card, painel lateral abre/fecha |
| Inbox | Envio de mensagem, upload de arquivo, filtros |
| Automações | Criar nó, conectar nós, testar fluxo com mock |
| Agenda | Criar evento, conflito de horários, sync Google |
| Financeiro | Marcar comissão como paga, gerar contrato PDF |
| Notificações | WebSocket entrega em tempo real, badge atualiza |

### Testes de Integração

| Área | Escopo |
|------|--------|
| Evolution API | Envio/recebimento de mensagens WhatsApp |
| Meta Graph API | Conexão Instagram/Facebook |
| Google Calendar | Sincronização bidirecional |
| MinIO/S3 | Upload/download de arquivos |
| BullMQ | Jobs executam corretamente, retries funcionam |
| WebSocket | Reconexão automática, rooms por imobiliária |

### Testes E2E (Críticos)

| Fluxo | Descrição |
|-------|-----------|
| Cadastro → Aprovação → Login | Imobiliária se cadastra, super_admin aprova, admin faz login |
| Lead → Pipeline → Proposta → Contrato | Lead entra, move no Kanban, proposta aprovada, contrato gerado |
| Mensagem WhatsApp → Inbox → Resposta | Mensagem chega, conversa criada, corretor responde |
| Automação: Lead novo → Follow-up | Lead entra, automação dispara, tarefa criada automaticamente |

### Estrutura de Testes

```
backend/tests/
├── unit/
│   ├── services/
│   │   ├── commission.service.test.js
│   │   ├── queue.service.test.js
│   │   ├── automation.service.test.js
│   │   └── search.service.test.js
│   ├── utils/
│   │   ├── permissions.util.test.js
│   │   ├── pipeline.util.test.js
│   │   └── validators.test.js
│   └── middleware/
│       └── multitenant.test.js
├── properties/
│   ├── commission.property.test.js
│   ├── pipeline.property.test.js
│   ├── queue.property.test.js
│   ├── template.property.test.js
│   ├── search.property.test.js
│   ├── stock.property.test.js
│   └── automation-validation.property.test.js
├── integration/
│   ├── auth.test.js
│   ├── inbox.test.js
│   └── websocket.test.js
└── e2e/
    ├── lead-to-contract.test.js
    └── inbox-flow.test.js

frontend/tests/
├── unit/
│   ├── components/
│   │   ├── Badge.test.jsx
│   │   ├── Modal.test.jsx
│   │   └── Sidebar.test.jsx
│   └── hooks/
│       └── usePermission.test.js
├── properties/
│   ├── sidebar-role.property.test.js
│   ├── badge-contrast.property.test.js
│   ├── kpi-role.property.test.js
│   └── redirect-role.property.test.js
└── integration/
    ├── pipeline-dnd.test.jsx
    └── inbox-chat.test.jsx
```

---


## Apêndice A: Design do Sistema Real-Time (WebSocket)

### Arquitetura Socket.io

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Server as Socket.io Server
    participant Redis as Redis Adapter
    participant Worker as BullMQ Worker

    Client->>Server: connect (JWT token)
    Server->>Server: Validate JWT
    Server->>Server: Join rooms (user:{id}, imobiliaria:{id})
    
    Worker->>Redis: Publish notification event
    Redis->>Server: Broadcast to room
    Server->>Client: notification:new
    
    Client->>Server: conversation:join(convId)
    Server->>Server: Join room conversation:{convId}
    Note over Client,Server: Real-time messages in conversation
```

### Configuração do Servidor

```javascript
// server.js - Socket.io setup
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL },
  transports: ['websocket', 'polling']
});

// Redis adapter para escalabilidade horizontal
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
```

---

## Apêndice B: Design da Integração de IA

### Arquitetura do Serviço de IA

```mermaid
graph TB
    subgraph Triggers["Gatilhos"]
        Inbox[Nova Mensagem Inbox]
        Pipeline[Lead Mudou Estágio]
        Analytics[Solicitação de Insight]
        Search[Busca Natural Language]
    end

    subgraph AIService["AI Service Layer"]
        Router[AI Router]
        PromptBuilder[Prompt Builder]
        ContextLoader[Context Loader]
        ResponseParser[Response Parser]
    end

    subgraph Providers["Providers"]
        OpenAI[OpenAI GPT-4]
        Claude[Claude API]
    end

    subgraph Output["Saídas"]
        Suggestion[Sugestão de Resposta]
        Qualification[Qualificação de Lead]
        Insight[Insight Analítico]
        SearchResult[Resultado de Busca]
    end

    Triggers --> Router
    Router --> PromptBuilder
    PromptBuilder --> ContextLoader
    ContextLoader --> Providers
    Providers --> ResponseParser
    ResponseParser --> Output
```

### Funcionalidades da IA

| Funcionalidade | Provider | Contexto | Output |
|----------------|----------|----------|--------|
| Sugestão de resposta | GPT-4 | Últimas 10 msgs + dados do lead | 2-3 opções de resposta |
| Qualificação automática | GPT-4 | Histórico do lead + critérios | Score 1-10 + justificativa |
| Atendimento automático | GPT-4 | Prompt customizado + FAQ | Resposta direta ao lead |
| Insights analíticos | Claude | Dados agregados 30 dias | Texto com observações |
| Busca em linguagem natural | GPT-4 | Schema do banco + query | SQL/filtros estruturados |
| Forecasting | Claude | Histórico de vendas | Projeções + probabilidades |

### Controle de Custos

- Limite de tokens/mês configurável por imobiliária (ConfigImobiliaria.iaLimiteTokensMes)
- Cache de respostas similares no Redis (TTL: 1h para sugestões, 24h para insights)
- Fallback para operação manual quando limite atingido
- Dashboard de consumo na página de configurações de IA

---

## Apêndice C: Design do Motor de Automações

### Arquitetura do Engine

```mermaid
graph TD
    subgraph Trigger["Gatilhos (Event Listeners)"]
        NewLead[Novo Lead]
        StageChange[Lead Mudou Estágio]
        MessageIn[Mensagem Recebida]
        Timer[Timer/Cron]
        DateTrigger[Data Específica]
    end

    subgraph Engine["Automation Engine (BullMQ)"]
        EventBus[Event Bus]
        Matcher[Trigger Matcher]
        Executor[Flow Executor]
        NodeRunner[Node Runner]
    end

    subgraph Nodes["Tipos de Nó"]
        Condition[Condição IF/ELSE]
        Wait[Espera]
        SendMsg[Enviar Mensagem]
        MoveStage[Mover Pipeline]
        CreateTask[Criar Tarefa]
        AssignUser[Atribuir Corretor]
        AIDecision[Decisão IA]
    end

    Trigger --> EventBus
    EventBus --> Matcher
    Matcher --> Executor
    Executor --> NodeRunner
    NodeRunner --> Nodes
    Nodes -->|next node| NodeRunner
```

### Fluxo de Execução

1. **Evento ocorre** (ex: novo lead criado)
2. **Event Bus** publica evento no Redis pub/sub
3. **Trigger Matcher** busca automações ativas com gatilho correspondente
4. **Job criado** no BullMQ com `automationId` + dados do evento
5. **Flow Executor** percorre o grafo de nós sequencialmente
6. **Node Runner** executa cada nó conforme seu tipo
7. **Logs** registrados em `AutomationExec` para monitoramento

### Formato de Nós (JSON no banco)

```json
{
  "nodes": [
    { "id": "1", "type": "trigger", "data": { "event": "novo_lead", "filters": {} } },
    { "id": "2", "type": "wait", "data": { "duration": 60, "unit": "minutes" } },
    { "id": "3", "type": "condition", "data": { "field": "temperatura", "operator": "eq", "value": "quente" } },
    { "id": "4", "type": "action", "data": { "action": "send_whatsapp", "templateId": 5 } },
    { "id": "5", "type": "action", "data": { "action": "create_task", "taskType": "follow_up", "prazo": "+24h" } }
  ],
  "edges": [
    { "source": "1", "target": "2" },
    { "source": "2", "target": "3" },
    { "source": "3", "target": "4", "label": "sim" },
    { "source": "3", "target": "5", "label": "nao" }
  ]
}
```

---


## Apêndice D: Estratégia de Armazenamento de Arquivos

### MinIO (S3-Compatible)

```
Bucket Structure:
├── {imobiliariaId}/
│   ├── empreendimentos/
│   │   └── {empreendimentoId}/
│   │       ├── cover.jpg
│   │       └── gallery/
│   ├── marketing/
│   │   └── {materialId}/
│   ├── contratos/
│   │   └── {contratoId}.pdf
│   ├── inbox/
│   │   └── {conversationId}/
│   │       └── {messageId}/  (imagens, áudios, documentos)
│   ├── landing-pages/
│   │   └── {pageId}/assets/
│   └── users/
│       └── {userId}/avatar.jpg
```

### Políticas de Acesso

- Uploads passam pelo backend (validação + multi-tenant)
- URLs pré-assinadas (presigned URLs) para download direto do MinIO
- TTL de URLs: 1h para conteúdo privado, permanente para landing pages públicas
- Max file size: 10MB para imagens, 25MB para documentos, 5MB para áudios

### Upload Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as Backend API
    participant MinIO as MinIO Storage

    Client->>API: POST /upload (multipart/form-data)
    API->>API: Validate file type + size + tenant
    API->>MinIO: PutObject (bucket/path)
    MinIO-->>API: Object URL / Key
    API-->>Client: { url, key, size }
```

---

## Apêndice E: Infraestrutura e Deploy

### Diagrama de Infraestrutura

```mermaid
graph TB
    subgraph Internet
        Users[Usuários]
        WhatsApp[WhatsApp]
        Meta[Instagram/Facebook]
    end

    subgraph Proxy["Reverse Proxy"]
        Nginx[Nginx]
    end

    subgraph App["Application Servers"]
        FE[Frontend - Static Files]
        API[Express API + Socket.io]
        Workers[BullMQ Workers]
    end

    subgraph Data["Data Layer"]
        MySQL[(MySQL 8)]
        Redis[(Redis 7)]
        MinIO[(MinIO)]
    end

    subgraph External["External Services"]
        Evolution[Evolution API]
        OpenAI[OpenAI API]
        GCal[Google Calendar]
    end

    Users --> Nginx
    WhatsApp --> Evolution
    Meta --> API
    Nginx --> FE
    Nginx --> API
    API --> MySQL
    API --> Redis
    API --> MinIO
    Workers --> MySQL
    Workers --> Redis
    Workers --> External
    Evolution --> API
```

### Docker Compose (Desenvolvimento)

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: crm_imobiliario
    ports: ["3306:3306"]
    volumes: ["mysql_data:/var/lib/mysql"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASS}
    ports: ["9000:9000", "9001:9001"]
    volumes: ["minio_data:/data"]

  evolution-api:
    image: atendai/evolution-api
    ports: ["8080:8080"]
    environment:
      AUTHENTICATION_API_KEY: ${EVOLUTION_KEY}

  backend:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [mysql, redis, minio]
    environment:
      DATABASE_URL: mysql://root:${DB_PASSWORD}@mysql:3306/crm_imobiliario
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000

  frontend:
    build: ./frontend
    ports: ["1234:1234"]

volumes:
  mysql_data:
  minio_data:
```

### Variáveis de Ambiente Adicionais

```env
# Redis
REDIS_URL=redis://localhost:6379

# MinIO / S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=crm-imobiliario

# IA
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
CLAUDE_API_KEY=sk-ant-...

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=...

# Meta Graph API
META_APP_ID=...
META_APP_SECRET=...

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...

# WebSocket
WS_CORS_ORIGIN=http://localhost:1234

# BullMQ
BULL_REDIS_URL=redis://localhost:6379
BULL_CONCURRENCY=5
```

---

## Apêndice F: Fases de Implementação

```mermaid
gantt
    title Roadmap de Implementação
    dateFormat  YYYY-MM-DD
    section Fase 1 - Core
    Modernizar páginas existentes    :f1a, 2025-01-15, 30d
    Design System completo           :f1b, 2025-01-15, 20d
    Perfil do Usuário               :f1c, after f1b, 10d
    Sidebar expandida               :f1d, after f1b, 10d
    
    section Fase 2 - CRM
    Pipeline Kanban                  :f2a, after f1a, 25d
    Tarefas/Follow-ups              :f2b, after f2a, 15d
    Notificações Real-time          :f2c, after f2a, 15d
    Busca Global                    :f2d, after f2b, 10d
    Configurações                   :f2e, after f1a, 10d
    
    section Fase 3 - Atendimento
    Inbox Unificado (WebSocket)     :f3a, after f2c, 35d
    Integração WhatsApp             :f3b, after f3a, 20d
    Integração Meta                 :f3c, after f3b, 15d
    Templates de Mensagens          :f3d, after f3a, 10d
    Filas de Atendimento            :f3e, after f3d, 10d
    
    section Fase 4 - IA
    Serviço de IA                   :f4a, after f3a, 20d
    Sugestões no Inbox              :f4b, after f4a, 10d
    Qualificação automática         :f4c, after f4a, 10d
    Busca com NLP                   :f4d, after f4a, 10d
    
    section Fase 5 - Automações
    Editor visual (React Flow)      :f5a, after f4a, 30d
    Engine de execução (BullMQ)     :f5b, after f5a, 20d
    Templates de fluxo              :f5c, after f5b, 10d
    
    section Fase 6 - Marketing + Agenda
    Agenda/Calendário               :f6a, after f2b, 20d
    Campanhas Marketing             :f6b, after f6a, 15d
    Landing Pages Builder           :f6c, after f6b, 25d
    
    section Fase 7 - Financeiro + Analytics
    Comissões                       :f7a, after f5b, 15d
    Contratos                       :f7b, after f7a, 15d
    Dashboard BI                    :f7c, after f7a, 20d
    Forecasting IA                  :f7d, after f7c, 15d
    Relatórios                      :f7e, after f7c, 10d
    
    section Fase 8 - Integrações
    Portais Imobiliários            :f8a, after f7e, 20d
    Webhooks/API Pública            :f8b, after f8a, 15d
    Auditoria/Logs                  :f8c, after f8b, 10d
```

### Dependências entre Fases

| Fase | Depende de | Infra Necessária |
|------|-----------|-----------------|
| Fase 1 | — | Apenas frontend refactoring |
| Fase 2 | Fase 1 | Redis + WebSocket server |
| Fase 3 | Fase 2 | Evolution API + Redis pub/sub |
| Fase 4 | Fase 3 | OpenAI API key + Redis cache |
| Fase 5 | Fase 4 | BullMQ + Redis |
| Fase 6 | Fase 2 | Google Calendar API + MinIO |
| Fase 7 | Fase 5 | PDF generation lib |
| Fase 8 | Fase 7 | Webhook delivery system |
