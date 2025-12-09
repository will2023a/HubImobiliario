# CRM Imobiliário - Sistema Completo com Hierarquia

Sistema CRM completo para imobiliárias com gestão hierárquica de usuários, empreendimentos, unidades e propostas.

## 🏗️ Arquitetura

### Backend
- **Node.js** + **Express** 4.18.2
- **Prisma ORM** 5.22.0 com MySQL
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- Arquitetura MVC com middlewares

### Frontend
- **React** 18.2.0
- **React Router DOM** 6.14.1
- **Axios** 1.4.0
- **Parcel** 2.9.3 (bundler)
- Design system moderno com CSS custom properties

## 🎯 Funcionalidades Principais

### 1. Hierarquia de Usuários
- **Super Admin**: Acesso total ao sistema, gerencia todas imobiliárias
- **Admin Imobiliária**: Gerencia sua imobiliária
- **Diretor**: Gerencia gerentes e corretores
- **Gerente**: Gerencia equipe de corretores
- **Corretor**: Trabalha com leads e propostas

### 2. Gestão de Empreendimentos
- CRUD completo de empreendimentos (loteamentos, condomínios, edifícios)
- Dashboard com estatísticas em tempo real
- Gestão de unidades (lotes, casas, apartamentos)
- Controle financeiro (valor base + juros = valor total)
- Status: planejamento, construção, pronto, concluído

### 3. Sistema de Unidades
- Identificação única por unidade
- Tipos: lote, casa, apartamento
- Valores: base, juros, total (calculado automaticamente)
- Status: disponível, reservado, vendido
- Área em m²

### 4. Sistema de Propostas
- Dados completos do cliente (nome, email, telefone, CPF, endereço)
- Múltiplas formas de pagamento:
  - À vista
  - Parcelado: 30/60/90 dias
  - Recorrente: mensal, semestral, anual
  - Financiamento bancário
- Aprovação hierárquica (gerente/diretor)
- Filtros por status, corretor, empreendimento

## 🚀 Como Executar

### 1. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env
cat > .env << EOF
DATABASE_URL="mysql://user:password@localhost:3306/crm_imobiliario"
JWT_SECRET="sua_chave_secreta_muito_segura_aqui"
NODE_ENV="development"
EOF

# Executar migrations
npx prisma migrate dev --name init

# Popular banco com dados de teste
npm run seed

# Iniciar servidor
npm run dev
```

### 2. Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar aplicação
npm start
```

### 3. Acessar Sistema

- Frontend: http://localhost:1234
- Backend API: http://localhost:3000

**Credenciais de teste** (após seed):
- Super Admin: `super@admin.com` / `123456`
- Admin Imobiliária: `admin@imob1.com` / `123456`
- Diretor: `diretor@imob1.com` / `123456`
- Gerente 1: `gerente1@imob1.com` / `123456`
- Corretor 1: `corretor1@imob1.com` / `123456`

## ✅ Progresso do Desenvolvimento

### Backend (Completo)
- ✅ Estrutura MVC
- ✅ Autenticação JWT
- ✅ Middlewares (auth, roles, permissions, multitenant)
- ✅ CRUD Empreendimentos
- ✅ CRUD Unidades (com cálculo automático)
- ✅ CRUD Propostas (com filtro hierárquico)
- ✅ Sistema de Permissões
- ✅ Seed com dados hierárquicos
- ✅ Validações

### Frontend (Em Progresso)
- ✅ Design System (global.css)
- ✅ Componentes UI (Button, Card, Input)
- ✅ Layout com Sidebar
- ✅ Lista de Empreendimentos
- ✅ Dashboard de Empreendimento
- ⏳ Formulário de Empreendimento
- ⏳ Formulário de Unidade
- ⏳ Sistema de Propostas
- ⏳ Painel de Permissões
- ⏳ Gestão de Hierarquia

## 🎨 Design System

### Cores Principais
- Primary: `#6366f1` (Indigo)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

### Componentes Criados
- **Button**: 7 variantes (primary, secondary, outline, ghost, success, warning, error)
- **Card**: Container com hover effects
- **Input**: Input, Select, Textarea com validação
- **Layout**: Sidebar colapsável + Header

## 📡 Rotas da API

### Empreendimentos
- `GET /empreendimentos` - Listar
- `GET /empreendimentos/:id` - Dashboard
- `POST /empreendimentos` - Criar
- `PUT /empreendimentos/:id` - Atualizar
- `DELETE /empreendimentos/:id` - Deletar

### Unidades
- `GET /unidades` - Listar
- `POST /unidades` - Criar
- `PATCH /unidades/:id` - Atualizar
- `DELETE /unidades/:id` - Deletar

### Propostas
- `GET /propostas` - Listar (filtro hierárquico)
- `POST /propostas` - Criar
- `PATCH /propostas/:id/aprovar` - Aprovar
- `PATCH /propostas/:id/rejeitar` - Rejeitar

## 📝 Comandos Úteis

```bash
# Backend
npm run dev              # Inicia servidor (nodemon)
npx prisma studio        # Interface visual do banco
npx prisma migrate dev   # Cria migration
npm run seed             # Popula banco

# Frontend
npm start                # Dev server (porta 1234)
npm run build            # Build de produção
```

---

**Desenvolvido com ❤️ para revolucionar a gestão imobiliária no Brasil**
