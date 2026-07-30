# Tarefas de Implementação — CRM Imobiliário SaaS

## FASE 1 — Modernização UI & Design System

### Task 1: Completar Design System (Componentes UI) ✅
- [x] Criar `frontend/src/components/ui/Modal.jsx` + CSS — Modal com tamanhos sm/md/lg, fechar via ESC/click fora/botão X
- [x] Criar `frontend/src/components/ui/Badge.jsx` + CSS — Badge colorido para status, tags e contadores (WCAG AA contraste)
- [x] Criar `frontend/src/components/ui/Table.jsx` + CSS — Tabela com ordenação por coluna, seleção de linhas
- [x] Criar `frontend/src/components/ui/Spinner.jsx` + CSS — Loading inline, fullpage e skeleton
- [x] Criar `frontend/src/components/ui/Toast.jsx` + CSS — Notificações (success, error, warning, info) com auto-dismiss
- [x] Criar `frontend/src/components/ui/Dropdown.jsx` + CSS — Menus contextuais (ações em tabelas/cards)
- [x] Criar `frontend/src/components/ui/Tooltip.jsx` + CSS — Tooltip on hover com posicionamento automático
- [x] Criar `frontend/src/components/ui/Pagination.jsx` + CSS — Navegação de páginas + contador total
- [x] Criar `frontend/src/components/ui/Tabs.jsx` + CSS — Organização de conteúdo em abas
- [x] Criar `frontend/src/components/ui/Avatar.jsx` + CSS — Foto do usuário com fallback de iniciais
- [x] Criar `frontend/src/components/ui/EmptyState.jsx` + CSS — Estado vazio com ilustração e CTA
- [x] Criar `frontend/src/components/ui/index.js` — Barrel export de todos os componentes UI

### Task 2: Refatorar Layout (Sidebar + Header) ✅
- [x] Extrair `frontend/src/components/layout/Sidebar.jsx` — Sidebar com seções colapsáveis agrupadas por módulo
- [x] Extrair `frontend/src/components/layout/Header.jsx` — Header com busca global, notificações e perfil
- [x] Refatorar `frontend/src/components/layout/Layout.jsx` — Integrar novos Sidebar e Header
- [x] Atualizar items do menu: agrupar por seções (Principal, CRM, Imóveis, Atendimento, Marketing, Agenda, Financeiro, Analytics, Admin)
- [x] Implementar responsividade mobile (sidebar como drawer overlay em telas < 768px)
- [ ] Criar `frontend/src/styles/variables.css` — Design tokens separados (cores, espaçamentos, shadows)
- [ ] Criar `frontend/src/styles/themes/dark.css` e `light.css` — Temas via CSS custom properties
- [ ] Criar `frontend/src/contexts/ThemeContext.jsx` — Toggle dark/light mode

### Task 3: Limpar Arquivos Duplicados ✅
- [x] Remover `/pages/AguardarAprovacao.jsx` (manter AguardandoAprovacao.jsx)
- [x] Remover `/pages/CriarLead.jsx` (manter CreateLead.jsx)
- [x] Remover `/pages/CriarImovel.jsx` (manter CreateImovel.jsx)
- [x] Remover `/pages/CriarUser.jsx` (manter CreateUser.jsx)
- [x] Atualizar imports em App.jsx e Dashboard.jsx se necessário (já corretos)

### Task 4: Modernizar Página de Login ✅
- [x] Refatorar `frontend/src/pages/Login.jsx` — Design moderno dark theme, validação visual em tempo real
- [x] Adicionar loading state no botão de submit
- [x] Adicionar link para cadastro de imobiliária
- [x] Adicionar mensagem de erro sem revelar campo incorreto
- [x] Remover conteúdo duplicado existente no arquivo

### Task 5: Criar Dashboard Home com KPIs ✅
- [x] Criar `frontend/src/components/shared/KPICard.jsx` — Card reutilizável para métricas
- [x] Refatorar `DashboardHome` em `frontend/src/pages/Dashboard.jsx` — Layout com grid de KPIs
- [x] Implementar cards: Leads novos, Propostas pendentes, Vendas do mês, Taxa de conversão
- [x] Adicionar lista de atividades recentes (últimas 5 propostas)
- [x] Filtrar KPIs por role do usuário (dados vêm das APIs existentes filtradas por role)
- [x] Criar `frontend/src/pages/Dashboard.css` — Estilos do dashboard home
- [ ] Criar endpoint `GET /analytics/dashboard` no backend para dados do dashboard (futuro - Fase 7)

### Task 6: Modernizar Página de Leads ✅
- [x] Refatorar `frontend/src/pages/Leads.jsx` — Usar componentes Table, Badge, Pagination
- [x] Adicionar filtros: status, origem, corretor, período
- [x] Adicionar busca por nome/telefone/e-mail
- [x] Adicionar badges coloridos por status do lead
- [x] Implementar paginação
- [x] Adicionar botão "Novo Lead" condicionado por role

### Task 7: Modernizar Páginas de Imóveis e Usuários ✅
- [x] Refatorar `frontend/src/pages/Imoveis.jsx` — Grid de cards com título, valor, cidade, status + filtros
- [x] Refatorar `frontend/src/pages/Users.jsx` — Tabela com nome, e-mail, role, ações
- [x] Refatorar `frontend/src/pages/CreateLead.jsx` — Form moderno com validação, usando componentes UI
- [x] Refatorar `frontend/src/pages/CreateImovel.jsx` — Form moderno com validação
- [x] Refatorar `frontend/src/pages/CreateUser.jsx` — Form com select de role
- [x] Modernizar `frontend/src/pages/LeadDetail.jsx` — Layout com Card, Badge, Timeline, form de atendimento

### Task 8: Criar Página de Perfil do Usuário ✅
- [x] Criar `frontend/src/pages/Perfil.jsx` — Dados do usuário, alterar nome/senha
- [x] Adicionar rota `/dashboard/perfil` em Dashboard.jsx
- [x] Criar `frontend/src/pages/Perfil.css` — Estilos
- [x] Integrar com componente Avatar

### Task 9: Modernizar Super Admin - Imobiliárias ✅
- [x] Página já existe modernizada com tabela, filtros por status, ações aprovar/suspender
- [x] Usa componentes Card, Button, Input, Select
- [x] Exibe métricas: total, ativas, pendentes, inativas

---

## FASE 2 — Pipeline CRM + Tarefas + Notificações

### Task 10: Schema e Migração — Pipeline + Notificações + Tarefas ✅
- [x] Adicionar models PipelineStage, LeadPipeline ao `backend/prisma/schema.prisma`
- [x] Adicionar models Task, Notification ao schema
- [x] Adicionar model ConfigImobiliaria ao schema
- [x] Adicionar campos `temperatura`, `tags` ao model Lead existente
- [x] Adicionar relações novas ao model User e Imobiliaria
- [ ] Rodar `npx prisma migrate dev --name add_pipeline_tasks_notifications`
- [ ] Atualizar seed para criar estágios default do pipeline

### Task 11: Backend — Rotas do Pipeline CRM ✅
- [x] Criar `backend/src/routes/pipeline.js` — GET /stages, POST /stages, PUT /leads/:id/stage, GET /leads
- [x] Implementar lógica de mover lead entre estágios (atualiza status + enteredStageAt)
- [x] Filtrar leads no pipeline por role (corretor vê só seus, gerente vê equipe, etc.)
- [x] Registrar no app.js: `app.use('/pipeline', pipelineRoutes)`

### Task 12: Frontend — Pipeline Kanban ✅
- [x] Criar Pipeline com HTML5 drag & drop nativo (sem dependência externa por enquanto)
- [x] Criar `frontend/src/pages/crm/Pipeline.jsx` — Kanban board com colunas, cards, drag & drop
- [x] Criar `frontend/src/pages/crm/Pipeline.css` — Estilos do Kanban
- [x] Cards com nome, telefone, badge temperatura, dias no estágio, corretor
- [x] Adicionar rota `/dashboard/pipeline` em Dashboard.jsx
- [x] Auto-criação de estágios default na primeira carga

### Task 13: Backend — Rotas de Tarefas ✅
- [x] Criar `backend/src/routes/tasks.js` — GET, POST, PUT, PUT /:id/complete, DELETE
- [x] Filtrar tarefas por role (corretor vê só suas, gerente vê equipe)
- [x] Implementar lógica de marcar como concluída (atualiza concluidaEm)
- [x] Registrar no app.js

### Task 14: Frontend — Página de Tarefas ✅
- [x] Criar `frontend/src/pages/crm/Tarefas.jsx` — Lista de tarefas com filtros (tipo, status, prazo)
- [x] Usar Badge para prioridade e status
- [x] Modal para criação de tarefa (título, tipo, prioridade, prazo)
- [x] Botão concluir tarefa em cada linha
- [x] Adicionar rota `/dashboard/tarefas` em Dashboard.jsx

### Task 15: Backend — Infraestrutura Real-Time (WebSocket + Redis) ✅
- [x] Instalar `socket.io`
- [x] Criar `backend/src/socket.js` — Setup Socket.io com auth middleware JWT, rooms (user, imobiliaria, pipeline, conversation)
- [x] Atualizar `backend/src/server.js` — HTTP server + Socket.io integrado
- [x] Implementar helpers: emitToUser, emitToImobiliaria, emitPipelineUpdate
- [x] Criar `backend/src/services/notification.service.js` — Criar notificação + emitir via WebSocket
- [ ] Adicionar Redis adapter para escalabilidade (opcional, funciona sem Redis em single-instance)

### Task 16: Backend — Rotas de Notificações ✅
- [x] Criar `backend/src/routes/notifications.js` — GET, PUT /:id/read, PUT /read-all
- [x] Registrar no app.js

### Task 18: Backend — Busca Global ✅
- [x] Criar `backend/src/routes/search.js` — GET /search?q=termo (busca em leads, imóveis, empreendimentos, propostas)
- [x] Filtrar resultados por role e imobiliariaId
- [x] Registrar no app.js

### Task 20: Página de Configurações da Imobiliária ✅ (backend)
- [x] Criar `backend/src/routes/config.js` — GET /config, PUT /config
- [ ] Criar `frontend/src/pages/admin/Configuracoes.jsx` — Seções: Dados da empresa, Horário, Comissões, Tema
- [ ] Adicionar rota `/dashboard/configuracoes` e item na Sidebar (admin_imobiliaria only)

### Task 17: Frontend — Notificações Real-Time ✅
- [x] Instalar `socket.io-client`
- [x] Criar `frontend/src/services/socket.js` — Instância Socket.io client com reconnect
- [x] Criar `frontend/src/contexts/SocketContext.jsx` — Conexão WebSocket + join rooms
- [x] Criar `frontend/src/contexts/NotificationContext.jsx` — Estado de notificações, contador não-lidas
- [x] Criar `frontend/src/components/shared/NotificationBell.jsx` + CSS — Sino com badge + dropdown lista
- [x] Integrar NotificationBell no Header
- [x] Integrar SocketProvider e NotificationProvider no App.jsx
- [x] Integrar ToastProvider no App.jsx

### Task 18: Backend — Busca Global
- [ ] Criar `backend/src/routes/search.js` — GET /search?q=termo (busca em leads, imóveis, empreendimentos, propostas)
- [ ] Criar `backend/src/services/search.service.js` — Full-text search via SQL LIKE/FULLTEXT
- [ ] Filtrar resultados por role e imobiliariaId
- [ ] Registrar no app.js

### Task 19: Frontend — Busca Global ✅
- [x] Criar `frontend/src/components/shared/SearchGlobal.jsx` + CSS — Modal com input, resultados agrupados por tipo
- [x] Debounce de 300ms para busca em tempo real
- [x] Integrar SearchGlobal no Header (botão + Ctrl+K)
- [x] Navegar para detalhe do item ao selecionar resultado

### Task 20: Página de Configurações da Imobiliária
- [ ] Criar `backend/src/routes/config.js` — GET /config, PUT /config
- [ ] Criar `frontend/src/pages/admin/Configuracoes.jsx` — Seções: Dados da empresa, Horário, Comissões, Tema
- [ ] Adicionar rota `/dashboard/configuracoes` e item na Sidebar (admin_imobiliaria only)

---

## FASE 3 — Inbox Unificado + WhatsApp

### Task 21: Schema e Migração — Conversas e Mensagens
- [ ] Adicionar models Conversation, Message, MessageTemplate, AtendimentoQueue, QueueMember ao schema
- [ ] Adicionar relação Conversation no model Lead e User
- [ ] Rodar `npx prisma migrate dev --name add_inbox_conversations`

### Task 22: Backend — Integração WhatsApp (Evolution API)
- [ ] Instalar `axios` (já existe) para comunicação com Evolution API
- [ ] Criar `backend/src/services/whatsapp.service.js` — Enviar/receber mensagens, conectar instância
- [ ] Criar webhook receiver para mensagens inbound do Evolution API
- [ ] Implementar lógica de vincular conversa a lead existente (por telefone)
- [ ] Adicionar variáveis EVOLUTION_API_URL, EVOLUTION_API_KEY ao `.env.example`

### Task 23: Backend — Rotas de Conversas
- [ ] Criar `backend/src/routes/conversations.js` — GET, GET /:id/messages, POST /:id/messages, PUT /:id/assign, PUT /:id/status
- [ ] Filtrar conversas por role (corretor vê atribuídas, gerente vê equipe)
- [ ] Emitir evento WebSocket `conversation:message` ao receber/enviar mensagem
- [ ] Implementar rooms WebSocket `conversation:{id}` para chat em tempo real
- [ ] Registrar no app.js

### Task 24: Frontend — Inbox Unificado
- [ ] Criar `frontend/src/components/features/inbox/ConversationList.jsx` — Lista de conversas (nome, última msg, canal badge)
- [ ] Criar `frontend/src/components/features/inbox/ChatArea.jsx` — Área de mensagens com scroll, timestamps
- [ ] Criar `frontend/src/components/features/inbox/MessageInput.jsx` — Input de texto + emoji + anexos
- [ ] Criar `frontend/src/components/features/inbox/ContactPanel.jsx` — Dados do lead/contato no painel direito
- [ ] Criar `frontend/src/pages/inbox/Inbox.jsx` — Layout split (lista | chat | painel contato)
- [ ] Integrar WebSocket para mensagens em tempo real
- [ ] Adicionar rota `/dashboard/inbox` e item na Sidebar

### Task 25: Backend — Templates de Mensagens
- [ ] Criar `backend/src/routes/templates.js` — GET, POST, GET /:id/render/:leadId
- [ ] Implementar renderização com substituição de variáveis ({{nome_lead}}, {{empreendimento}}, etc.)
- [ ] Registrar no app.js

### Task 26: Frontend — Templates de Mensagens
- [ ] Criar `frontend/src/pages/inbox/Templates.jsx` — Lista de templates por categoria, criar/editar
- [ ] Integrar templates no MessageInput (botão de atalho para selecionar template)
- [ ] Adicionar rota `/dashboard/templates`

### Task 27: Backend — Filas de Atendimento
- [ ] Criar `backend/src/routes/filas.js` — GET, POST, PUT /:id
- [ ] Criar `backend/src/services/queue.service.js` — Lógica de distribuição (round-robin, performance)
- [ ] Implementar atribuição automática quando lead entra na fila
- [ ] Registrar no app.js

### Task 28: Frontend — Filas de Atendimento
- [ ] Criar `frontend/src/pages/inbox/Filas.jsx` — Lista de filas, criar/editar regras, métricas
- [ ] Adicionar rota `/dashboard/filas`

### Task 29: Configuração de Canais
- [ ] Criar `frontend/src/pages/admin/ConfigCanais.jsx` — Lista de canais (WhatsApp, Instagram, Facebook, Email) com status
- [ ] Implementar conexão WhatsApp via QR Code (Evolution API)
- [ ] Adicionar rota `/dashboard/configuracoes/canais`

---

## FASE 4 — Inteligência Artificial

### Task 30: Backend — Serviço de IA
- [ ] Instalar `openai`
- [ ] Criar `backend/src/services/ai.service.js` — Abstração OpenAI/Claude com prompt builder e context loader
- [ ] Implementar funções: generateResponse, qualifyLead, summarizeConversation, searchNLP
- [ ] Implementar controle de custos (contagem de tokens por imobiliária)
- [ ] Criar `backend/src/routes/ai.js` — POST /suggest, POST /qualify, POST /summarize
- [ ] Registrar no app.js
- [ ] Adicionar OPENAI_API_KEY ao `.env.example`

### Task 31: Frontend — Sugestões IA no Inbox
- [ ] Criar `frontend/src/components/features/inbox/AISuggestions.jsx` — Cards com respostas sugeridas
- [ ] Integrar no ChatArea: ao receber mensagem, solicitar sugestão via API
- [ ] Ao clicar na sugestão, preencher o MessageInput com o texto

### Task 32: IA — Qualificação Automática de Leads
- [ ] Implementar endpoint POST /ai/qualify que analisa histórico do lead e retorna score + temperatura
- [ ] Integrar qualificação automática no pipeline: ao lead receber X mensagens, qualificar
- [ ] Exibir badge de temperatura no LeadCard do Pipeline

### Task 33: IA — Busca em Linguagem Natural
- [ ] Implementar endpoint GET /search/ai?q= que converte linguagem natural em filtros estruturados
- [ ] Integrar no SearchGlobal: detectar quando query parece linguagem natural vs busca simples
- [ ] Exibir resultados filtrados com explicação do que a IA entendeu

### Task 34: Frontend — Configuração de IA
- [ ] Criar `frontend/src/pages/admin/ConfigIA.jsx` — Toggle ativação, prompt customizado, limites, métricas de uso
- [ ] Adicionar rota `/dashboard/configuracoes/ia`

---

## FASE 5 — Motor de Automações

### Task 35: Schema e Migração — Automações
- [ ] Adicionar models Automation, AutomationExec ao schema (se não feito na Task 10)
- [ ] Rodar migration se necessário

### Task 36: Backend — Engine de Automações
- [ ] Instalar `bullmq`
- [ ] Criar `backend/src/workers/automation.worker.js` — BullMQ processor que executa fluxos
- [ ] Criar `backend/src/services/automation.service.js` — Flow executor (percorre nós sequencialmente)
- [ ] Implementar tipos de nó: Gatilho, Condição, Espera, Ação (enviar WhatsApp, criar tarefa, mover pipeline), IA
- [ ] Implementar Event Bus: escutar eventos (novo_lead, lead_mudou_estagio, mensagem_recebida)
- [ ] Implementar matching: quando evento ocorre, encontrar automações ativas com esse gatilho

### Task 37: Backend — Rotas de Automações
- [ ] Criar `backend/src/routes/automations.js` — GET, POST, PUT /:id, PUT /:id/toggle, POST /:id/test
- [ ] Implementar validação de fluxo (gatilho obrigatório, conexões válidas, sem nós desconectados)
- [ ] Registrar no app.js

### Task 38: Frontend — Editor Visual de Automações
- [ ] Instalar `reactflow`
- [ ] Criar `frontend/src/components/features/automations/FlowCanvas.jsx` — Canvas React Flow
- [ ] Criar `frontend/src/components/features/automations/NodePalette.jsx` — Paleta de nós draggable
- [ ] Criar `frontend/src/components/features/automations/NodeConfig.jsx` — Painel de configuração do nó selecionado
- [ ] Criar nós customizados: TriggerNode, ConditionNode, WaitNode, ActionNode, AINode
- [ ] Criar `frontend/src/pages/automations/AutomacaoEditor.jsx` — Página com Canvas + Paleta + Config
- [ ] Criar `frontend/src/pages/automations/AutomacoesList.jsx` — Lista de fluxos com toggle ativo/inativo
- [ ] Adicionar rotas `/dashboard/automacoes` e `/dashboard/automacoes/editor/:id`
- [ ] Adicionar item "Automações" na Sidebar

---

## FASE 6 — Agenda + Marketing Digital

### Task 39: Schema e Migração — Agenda + Campanhas
- [ ] Adicionar models AgendaEvent, Campaign, LandingPage ao schema (se não feito anteriormente)
- [ ] Rodar migration

### Task 40: Backend — Rotas de Agenda
- [ ] Criar `backend/src/routes/agenda.js` — GET /events, POST /events, PUT /events/:id, DELETE /events/:id
- [ ] Filtrar eventos por role (corretor vê só seus, gerente vê equipe)
- [ ] Implementar detecção de conflitos de horário
- [ ] Registrar no app.js

### Task 41: Frontend — Calendário/Agenda
- [ ] Instalar lib de calendário (FullCalendar ou custom com @dnd-kit)
- [ ] Criar `frontend/src/components/features/agenda/Calendar.jsx` — Views dia/semana/mês
- [ ] Criar `frontend/src/components/features/agenda/EventForm.jsx` — Formulário de criação/edição de evento
- [ ] Criar `frontend/src/pages/agenda/Agenda.jsx` — Página com calendário + filtros
- [ ] Implementar drag & drop para reagendar eventos
- [ ] Adicionar rota `/dashboard/agenda` e item na Sidebar

### Task 42: Backend — Google Calendar Sync
- [ ] Instalar `googleapis`
- [ ] Criar `backend/src/services/calendar.service.js` — OAuth2 flow + sync bidirecional
- [ ] Implementar endpoint POST /agenda/sync/google
- [ ] Salvar googleEventId em AgendaEvent para tracking
- [ ] Adicionar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ao `.env.example`

### Task 43: Backend — Rotas de Campanhas Marketing
- [ ] Criar `backend/src/routes/campaigns.js` — GET, POST, GET /:id/metrics
- [ ] Implementar tracking de UTM: ao criar lead com utm_campaign, vincular à campanha
- [ ] Registrar no app.js

### Task 44: Frontend — Campanhas Marketing
- [ ] Criar `frontend/src/pages/marketing/Campanhas.jsx` — Lista de campanhas com métricas
- [ ] Criar formulário de criação (nome, plataforma, UTMs, budget, período)
- [ ] Instalar `chart.js react-chartjs-2` para gráficos de performance
- [ ] Adicionar rota `/dashboard/marketing/campanhas`

### Task 45: Backend — Landing Pages
- [ ] Criar `backend/src/routes/landingPages.js` — GET, POST, PUT /:id, POST /:id/publish, POST /:slug/submit
- [ ] Endpoint público POST /:slug/submit cria lead automaticamente com origem "landing_page"
- [ ] Registrar no app.js

### Task 46: Frontend — Landing Pages
- [ ] Criar `frontend/src/pages/marketing/LandingPages.jsx` — Lista com métricas (visitas, conversões)
- [ ] Criar builder visual básico (blocos: hero, formulário, features, CTA)
- [ ] Adicionar rota `/dashboard/marketing/landing-pages`

---

## FASE 7 — Financeiro + Analytics

### Task 47: Schema e Migração — Financeiro
- [ ] Adicionar models Comissao, Contrato ao schema (se não feito anteriormente)
- [ ] Rodar migration

### Task 48: Backend — Comissões
- [ ] Criar `backend/src/routes/comissoes.js` — GET, PUT /:id/pagar
- [ ] Criar `backend/src/services/commission.service.js` — Calcular comissão ao aprovar proposta
- [ ] Integrar: quando proposta é aprovada, gerar comissões para corretor/gerente/diretor
- [ ] Usar percentuais de ConfigImobiliaria
- [ ] Registrar no app.js

### Task 49: Frontend — Comissões
- [ ] Criar `frontend/src/pages/financeiro/Comissoes.jsx` — Tabela com filtros (período, corretor, status)
- [ ] Exibir cards resumo: total vendido, total comissões, pendentes, pagas
- [ ] Botão "Marcar como Paga" para admin_imobiliaria
- [ ] Adicionar rota `/dashboard/financeiro/comissoes` e item na Sidebar

### Task 50: Backend — Contratos
- [ ] Criar `backend/src/routes/contratos.js` — GET, POST /from-proposta/:id, PUT /:id/enviar
- [ ] Implementar geração de PDF do contrato (usando dados da proposta)
- [ ] Integrar com MinIO para armazenar PDFs gerados
- [ ] Registrar no app.js

### Task 51: Frontend — Contratos
- [ ] Criar `frontend/src/pages/financeiro/Contratos.jsx` — Lista com status (rascunho, enviado, assinado)
- [ ] Botão "Gerar Contrato" em propostas aprovadas
- [ ] Visualização/download do PDF
- [ ] Adicionar rota `/dashboard/financeiro/contratos`

### Task 52: Backend — Analytics / BI
- [ ] Criar `backend/src/routes/analytics.js` — GET /dashboard, /funnel, /ranking, /forecasting, POST /reports/export
- [ ] Implementar queries agregadas: funil de conversão, vendas por período, leads por origem
- [ ] Implementar ranking de corretores (leads convertidos, vendas, tempo médio de resposta)
- [ ] Registrar no app.js

### Task 53: Frontend — Dashboard Analytics
- [ ] Criar `frontend/src/components/features/analytics/FunnelChart.jsx` — Gráfico de funil
- [ ] Criar `frontend/src/components/features/analytics/TimelineChart.jsx` — Gráfico de linha temporal
- [ ] Criar `frontend/src/components/features/analytics/RankingTable.jsx` — Tabela ranking corretores
- [ ] Criar `frontend/src/pages/analytics/Analytics.jsx` — Dashboard BI com gráficos + filtros de período
- [ ] Adicionar rota `/dashboard/analytics` e item na Sidebar

### Task 54: Frontend — Relatórios Exportáveis
- [ ] Criar `frontend/src/pages/analytics/Relatorios.jsx` — Relatórios pré-configurados com filtros
- [ ] Implementar exportação PDF e Excel via endpoint /analytics/reports/export
- [ ] Adicionar rota `/dashboard/analytics/relatorios`

---

## FASE 8 — Integrações + Auditoria + Infra

### Task 55: Schema e Migração — Auditoria + Webhooks
- [ ] Adicionar models AuditLog, Webhook, WebhookDelivery ao schema
- [ ] Rodar migration

### Task 56: Backend — Auditoria / Logs
- [ ] Criar `backend/src/routes/audit.js` — GET /audit (filtros: usuário, ação, período), POST /audit/export
- [ ] Criar middleware ou helper para registrar ações automaticamente (login, CRUD em recursos)
- [ ] Registrar no app.js

### Task 57: Frontend — Auditoria
- [ ] Criar `frontend/src/pages/admin/Auditoria.jsx` — Log cronológico com filtros e exportação
- [ ] Adicionar rota `/dashboard/auditoria`

### Task 58: Backend — Webhooks
- [ ] Criar `backend/src/routes/webhooks.js` — GET, POST, DELETE /:id, GET /:id/deliveries
- [ ] Implementar sistema de entrega: ao evento ocorrer, enviar POST para URLs registradas
- [ ] Registrar tentativas e respostas em WebhookDelivery
- [ ] Registrar no app.js

### Task 59: Frontend — Webhooks
- [ ] Criar `frontend/src/pages/admin/Webhooks.jsx` — Lista de webhooks, criar/editar, log de entregas
- [ ] Adicionar rota `/dashboard/configuracoes/webhooks`

### Task 60: Backend — Upload de Arquivos (MinIO)
- [ ] Instalar `multer minio`
- [ ] Criar `backend/src/services/storage.service.js` — Upload, download, presigned URLs
- [ ] Criar `backend/src/middlewares/upload.js` — Multer middleware
- [ ] Criar `backend/src/routes/upload.js` — POST /upload, DELETE /upload/:key
- [ ] Criar bucket structure por imobiliariaId
- [ ] Adicionar variáveis MINIO_* ao `.env.example`
- [ ] Registrar no app.js

### Task 61: Frontend — Upload de Arquivos
- [ ] Criar `frontend/src/components/shared/FileUpload.jsx` — Componente drag & drop com preview
- [ ] Criar `frontend/src/services/storage.js` — Upload service (multipart form data)
- [ ] Integrar FileUpload no EmpreendimentoForm (imagem do empreendimento)
- [ ] Integrar no MessageInput do Inbox (enviar imagens/documentos)

### Task 62: Docker Compose para Desenvolvimento
- [ ] Criar `docker-compose.yml` na raiz do projeto com: mysql, redis, minio, evolution-api
- [ ] Configurar volumes persistentes para mysql e minio
- [ ] Documentar instruções em COMO-RODAR.md

### Task 63: Integração Portais Imobiliários
- [ ] Criar `frontend/src/pages/admin/IntegracaoPortais.jsx` — Lista de portais com status
- [ ] Backend: endpoint para configurar credenciais de portal
- [ ] Backend: sync worker para publicar imóveis nos portais
- [ ] Adicionar rota `/dashboard/configuracoes/integracoes`

---

## FASE TRANSVERSAL — Hooks, Custom Hooks e Permissões

### Task 64: Custom Hooks Frontend
- [ ] Criar `frontend/src/hooks/usePermission.js` — Hook que verifica se user tem permissão para ação em recurso
- [ ] Criar `frontend/src/hooks/usePagination.js` — Hook para lógica de paginação (page, limit, total)
- [ ] Criar `frontend/src/hooks/useSocket.js` — Hook para subscrição a eventos WebSocket
- [ ] Criar `frontend/src/hooks/useNotifications.js` — Hook para notificações (contador, marcar lida)

### Task 65: Atualizar Roteamento Completo
- [ ] Atualizar `frontend/src/pages/Dashboard.jsx` com todas as novas rotas
- [ ] Atualizar `frontend/src/App.jsx` se necessário
- [ ] Garantir que todas as páginas novas estão importadas e registradas
- [ ] Verificar que PrivateRoute/RequireAuth protege todas as rotas

### Task 66: Backend — Rate Limiting
- [ ] Instalar `express-rate-limit`
- [ ] Criar `backend/src/middlewares/rateLimit.js` — Rate limit por IP e por usuário
- [ ] Aplicar em rotas sensíveis: /auth/login, /upload, /ai/*

---

## Resumo de Tarefas por Fase

| Fase | Tasks | Foco |
|------|-------|------|
| 1 | 1-9 | Modernização UI, Design System, Limpeza |
| 2 | 10-20 | Pipeline Kanban, Tarefas, Notificações, Busca, WebSocket |
| 3 | 21-29 | Inbox, WhatsApp, Templates, Filas |
| 4 | 30-34 | IA (sugestões, qualificação, busca NLP) |
| 5 | 35-38 | Automações visuais (React Flow + BullMQ) |
| 6 | 39-46 | Agenda, Google Calendar, Campanhas, Landing Pages |
| 7 | 47-54 | Comissões, Contratos, Analytics, Relatórios |
| 8 | 55-63 | Auditoria, Webhooks, Upload MinIO, Docker, Portais |
| Transversal | 64-66 | Hooks, Rotas, Rate Limiting |

**Total: 66 Tasks | ~250 subtarefas**
