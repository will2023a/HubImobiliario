# Gestor Pro 360

**Plataforma SaaS de Gestão Imobiliária** — CRM completo com Pipeline de Vendas, Inbox Unificado, IA, Automações e Analytics.

---

## 🏗️ Arquitetura

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Frontend      │     │      Backend          │     │  Database   │
│  React 18       │────▶│  Express + Socket.io  │────▶│  MySQL 8    │
│  Parcel         │◀────│  Prisma ORM           │     │             │
│  Port: 1234     │     │  Port: 3000 (→2000)   │     │  Port: 3308 │
└─────────────────┘     └──────────────────────┘     └─────────────┘
                               │         │
                        ┌──────┘         └──────┐
                        ▼                       ▼
                 ┌─────────────┐        ┌─────────────┐
                 │    Redis    │        │    MinIO     │
                 │  Cache/WS   │        │  Arquivos   │
                 │  Port: 6379 │        │  Port: 9000 │
                 └─────────────┘        └─────────────┘
```

---

## 📋 Módulos do Sistema

| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Core** | Auth JWT, Multi-tenant, Roles, Permissões | ✅ |
| **CRM** | Pipeline Kanban, Leads, Tarefas, Follow-ups | ✅ |
| **Imóveis** | Empreendimentos, Unidades (10 status), Propostas, Visitas | ✅ |
| **Inbox** | Chat unificado (WhatsApp, Instagram, Email), WebSocket real-time | ✅ |
| **IA** | Sugestões de resposta, Qualificação de leads, Resumos, Busca NLP | ✅ |
| **Agenda** | Calendário (dia/semana/mês), Eventos, Visitas, Lembretes | ✅ |
| **Marketing** | Materiais físicos, Campanhas, Tabela de Preços (NCC) | ✅ |
| **Financeiro** | Comissões automáticas por role, Pagamentos | ✅ |
| **Analytics** | Dashboard BI, Funil, Ranking corretores, Leads por origem | ✅ |
| **Mapa** | Mapa de Disponibilidade visual + Geolocalização (Leaflet) | ✅ |
| **Galeria** | Fotos por empreendimento com categorias | ✅ |
| **Notificações** | Real-time via WebSocket, Sino no header | ✅ |
| **Busca Global** | Ctrl+K, resultados agrupados, debounce | ✅ |
| **Automações** | Editor visual de fluxos (planejado) | 🔜 |

---

## 🔄 Fluxo Principal do Sistema

```
1. CADASTRO
   Imobiliária se cadastra → Aguarda aprovação → Super Admin aprova

2. HIERARQUIA
   Super Admin → Admin Imobiliária → Diretor → Gerente → Corretor

3. EMPREENDIMENTOS
   Admin cadastra empreendimento → Define unidades → Cria tabela de preços
   → Vincula equipes (imobiliárias parceiras) → Define comissões

4. CAPTAÇÃO DE LEADS
   Lead entra (WhatsApp/Site/Instagram/Manual) → Inbox recebe mensagem
   → IA sugere resposta → Corretor atende → Lead entra no Pipeline

5. PIPELINE DE VENDAS
   Novo → Contato → Qualificado → Visita → Proposta → Fechado
   (arrastar cards entre colunas)

6. PROPOSTA DE VENDA (PV)
   Corretor cria proposta → Unidade fica RESERVADA
   → Gerente/Diretor aprova → Unidade fica VENDIDA (vermelho)
   → Sistema gera comissões automaticamente

7. ACOMPANHAMENTO
   Dashboard com KPIs → Analytics com funil → Ranking corretores
   → Tarefas automáticas → Notificações real-time
```

---

## 🚀 Como Rodar

### Docker Compose (recomendado)

```bash
git clone <repo>
cd gestor-pro-360
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

### Acesso

| URL | Serviço |
|-----|---------|
| http://localhost:1234 | Frontend |
| http://localhost:2000 | Backend API |
| http://localhost:9001 | MinIO Console |

### Credenciais de Teste

| Role | Email | Senha |
|------|-------|-------|
| Super Admin | super@crm.com | super123 |
| Admin Imobiliária | admin@imob1.com | 123456 |

---

## 🧪 Testes

```bash
# Backend - testes unitários
cd backend
npm test

# Backend - testes de integração
npm run test:integration

# Frontend - (em breve)
cd frontend
npm test
```

---

## 📁 Estrutura de Pastas

```
├── backend/
│   ├── prisma/            # Schema + migrations
│   ├── src/
│   │   ├── middlewares/   # auth, multitenant, permissions, roles
│   │   ├── routes/        # 20+ rotas REST
│   │   ├── services/      # ai, whatsapp, notification
│   │   ├── utils/         # jwt, validators
│   │   ├── app.js         # Express config
│   │   ├── server.js      # HTTP + Socket.io
│   │   └── socket.js      # WebSocket setup
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/    # Sidebar, Header, Layout
│   │   │   ├── shared/    # KPICard, MiniMap, Gallery, Search, Notifications
│   │   │   └── ui/        # 14 componentes (Modal, Table, Badge, Toast, etc)
│   │   ├── contexts/      # Auth, Socket, Notification
│   │   ├── pages/         # Organizado por módulo
│   │   ├── services/      # api.js, socket.js
│   │   ├── styles/        # global.css, responsive.css
│   │   └── utils/         # masks.js
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🔌 APIs Backend (Resumo)

| Rota | Descrição |
|------|-----------|
| `POST /auth/login` | Login JWT |
| `GET /leads` | Listar leads (filtrado por role) |
| `GET /pipeline/stages` | Estágios do Kanban |
| `PUT /pipeline/leads/:id/stage` | Mover lead no pipeline |
| `GET /conversations` | Listar conversas (inbox) |
| `POST /conversations/:id/messages` | Enviar mensagem |
| `GET /tasks` | Listar tarefas |
| `POST /ai/suggest` | Sugestões IA para inbox |
| `POST /ai/qualify` | Qualificar lead com IA |
| `GET /analytics/dashboard` | KPIs do BI |
| `GET /analytics/ranking` | Ranking de corretores |
| `GET /comissoes` | Listar comissões |
| `GET /tabela-preco/:empId` | Tabelas de preço (NCC) |
| `GET /agenda/events` | Eventos do calendário |
| `GET /notifications` | Notificações |
| `GET /search?q=` | Busca global |
| `GET /config` | Configurações da imobiliária |

---

## 🛠️ Tecnologias

**Backend:** Node.js, Express, Prisma, MySQL, Socket.io, JWT, Axios

**Frontend:** React 18, React Router 6, Parcel, Axios, Leaflet, Socket.io Client

**Infra:** Docker, Redis, MinIO, Evolution API (WhatsApp)

**IA:** OpenAI GPT-4 (configurável)

---

## 📱 Responsividade

O sistema é **mobile-first** com layout adaptativo:
- Sidebar vira drawer no mobile (hamburger menu)
- Grids ajustam colunas automaticamente
- Touch-friendly (áreas de toque maiores)
- Tabelas com scroll horizontal
- Pipeline com scroll horizontal

---

## 📄 Licença

Proprietário — Gestor Pro 360 © 2026
