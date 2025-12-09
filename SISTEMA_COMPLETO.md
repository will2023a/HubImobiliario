# 🏢 CRM Imobiliário - Sistema Completo para Escala Nacional

## 📊 Visão Geral

Sistema multi-tenant enterprise-grade para gestão de imobiliárias em todo o Brasil com:
- **Hierarquia organizacional completa** (Super Admin → Admin Imobiliária → Diretor → Gerente → Corretor)
- **Isolamento total entre imobiliárias** (multitenancy seguro)
- **Sistema de permissões configurável**
- **Gestão completa de empreendimentos e propostas**

---

## 🏗️ Estrutura Hierárquica

```
Super Admin (Você)
    ↓
Admin Imobiliária (Cada imobiliária cadastrada)
    ↓
Diretor
    ↓
Gerente 1, Gerente 2, ...
    ↓
Corretor 1, Corretor 2, Corretor 3, ...
```

### Roles e Responsabilidades

**Super Admin (Você)**
- Cadastra e aprova novas imobiliárias
- Acesso total a todas as imobiliárias
- Configura permissões globais
- Monitora todo o sistema

**Admin Imobiliária**
- Gerencia sua imobiliária completa
- Cadastra diretores, gerentes e corretores
- Configura permissões específicas da imobiliária
- Acesso a todos os empreendimentos e propostas da sua imobiliária

**Diretor**
- Cria e gerencia empreendimentos
- Visualiza propostas de seus gerentes e corretores
- Gerencia equipe de gerentes

**Gerente**
- Atualiza empreendimentos
- Cria e gerencia propostas
- Visualiza propostas de seus corretores
- Gerencia equipe de corretores

**Corretor**
- Visualiza empreendimentos disponíveis
- Cria propostas para clientes
- Visualiza apenas suas próprias propostas

---

## 🔒 Sistema de Segurança

### Multitenancy Rigoroso
- Cada imobiliária tem dados completamente isolados
- Queries automáticas filtram por `imobiliariaId`
- Verificações em todos os endpoints sensíveis
- Zero chance de vazamento de dados entre imobiliárias

### Controle de Permissões Configurável
- Tabela `Permissao` permite configurar o que cada role pode fazer
- Granularidade por: `role` + `recurso` + `ação` + `imobiliária`
- Permissões globais (aplicam para todas) ou específicas por imobiliária
- Cache em memória para performance
- Apenas Super Admin e Admin Imobiliária podem modificar permissões

**Exemplo de Permissões:**
```javascript
{ role: 'gerente', recurso: 'empreendimentos', acao: 'ler', permitido: true }
{ role: 'corretor', recurso: 'propostas', acao: 'criar', permitido: true }
{ role: 'corretor', recurso: 'empreendimentos', acao: 'deletar', permitido: false }
```

---

## 🏘️ Módulo de Empreendimentos

### Informações do Empreendimento
- Nome do projeto
- Tipo de unidade (lote / casa / apartamento)
- Quantidade de unidades
- Imagem do empreendimento
- Localização completa (bairro, cidade, estado)
- Data de lançamento
- Data prevista para construção
- Até 5 contatos de gerentes de produto (nome + telefone)

### Dashboard do Empreendimento
Ao clicar em um empreendimento, você vê:
- Informações gerais
- Lista de todas as unidades (com status: disponível/reservado/vendido)
- Últimas propostas criadas
- Botão para editar empreendimento
- Botão para gerar financeiro (cadastrar unidades)

---

## 💰 Gestão Financeira (Unidades)

Cada unidade tem:
- Número da unidade (ex: 101, 102, lote 5, etc)
- Valor base
- Juros
- **Valor total** (calculado automaticamente: valor base + juros)
- Status (disponível / reservado / vendido)

Quando você cria/edita uma unidade, o sistema:
1. Recalcula automaticamente o valor total
2. Permite atualizar valores e juros
3. Atualiza status conforme propostas

---

## 📄 Sistema de Propostas

### Formulário de Proposta

**Dados do Cliente:**
- Nome e Sobrenome
- RG
- CPF
- Profissão
- Remuneração

**Seleção de Unidade:**
Ao selecionar a unidade do empreendimento, o sistema mostra o valor total automaticamente.

**Formas de Pagamento (todas opcionais):**
- Valor à vista
- Valor 30 dias
- Valor 60 dias
- Valor 90 dias
- Parcelas mensais
- Parcelas semestrais
- Parcelas anuais
- Parcela única
- Saldo a financiar

### Fluxo da Proposta
1. Corretor cria proposta → unidade fica **reservada**
2. Admin/Gerente aprova proposta → unidade fica **vendida**
3. Admin/Gerente rejeita proposta → unidade volta para **disponível**

### Filtros de Visualização (Hierárquicos)
- **Corretor**: vê apenas suas propostas
- **Gerente**: vê propostas de seus corretores + as suas
- **Diretor**: vê propostas de todos os gerentes/corretores subordinados
- **Admin Imobiliária**: vê todas as propostas da imobiliária
- **Super Admin**: vê tudo

---

## 🗄️ Banco de Dados (MySQL)

### Tabelas Principais

**User** - Usuários com hierarquia
- `diretorId` → se for gerente, aponta para o diretor
- `gerenteId` → se for corretor, aponta para o gerente
- `role` → super_admin, admin_imobiliaria, diretor, gerente, corretor

**Imobiliaria** - Empresas cadastradas
- Isolamento total de dados

**Permissao** - Controle granular
- Configurável por imobiliária

**Empreendimento** - Projetos imobiliários
- Até 5 gerentes de produto

**Unidade** - Lotes/casas/apartamentos
- Cálculo automático de valor total
- Status controlado por propostas

**Proposta** - Vendas
- Dados completos do cliente
- Múltiplas formas de pagamento
- Rastreamento por corretor

---

## 🚀 API Backend (Endpoints)

### Autenticação
- `POST /auth/register` - Criar usuário
- `POST /auth/login` - Login JWT

### Super Admin
- `GET /super/imobiliarias/pendentes` - Imobiliárias aguardando aprovação
- `PATCH /super/imobiliarias/:id/aprovar` - Aprovar imobiliária

### Permissões (só Super Admin e Admin Imobiliária)
- `GET /permissoes` - Listar permissões
- `POST /permissoes` - Criar/atualizar permissão
- `DELETE /permissoes/:id` - Deletar permissão

### Empreendimentos
- `POST /empreendimentos` - Criar (requer permissão)
- `GET /empreendimentos` - Listar (filtrado por imobiliária)
- `GET /empreendimentos/:id` - Dashboard completo
- `PATCH /empreendimentos/:id` - Atualizar
- `DELETE /empreendimentos/:id` - Deletar

### Unidades (Financeiro)
- `POST /unidades` - Criar unidade
- `GET /unidades/empreendimento/:id` - Listar unidades
- `GET /unidades/:id` - Detalhes
- `PATCH /unidades/:id` - Atualizar valores/status
- `DELETE /unidades/:id` - Deletar

### Propostas
- `POST /propostas` - Criar proposta
- `GET /propostas` - Listar (filtrado por hierarquia)
- `GET /propostas/:id` - Detalhes
- `PATCH /propostas/:id` - Atualizar status
- `DELETE /propostas/:id` - Deletar

---

## 🎯 Próximos Passos Recomendados

### Essenciais
1. **Upload de Imagens** - Implementar para empreendimentos
2. **Dashboard com Gráficos** - Métricas de vendas, conversão
3. **Relatórios** - Exportar propostas, comissões, vendas
4. **Notificações** - Email quando imobiliária é aprovada, proposta é criada

### Avançados
5. **Comissões Automáticas** - Calcular comissão por hierarquia (corretor, gerente, diretor)
6. **Contratos Digitais** - Gerar PDFs de propostas aprovadas
7. **Assinatura Eletrônica** - Integração com plataformas de e-signature
8. **CRM completo** - Funil de vendas, follow-up automático
9. **App Mobile** - Para corretores em campo
10. **WhatsApp Integration** - Envio automático de propostas

---

## 🔧 Como Usar (Fluxo Completo)

### 1. Como Super Admin (Você)
```bash
# Login
POST /auth/login
{
  "email": "super@crm.com",
  "password": "super123"
}

# Aprovar imobiliária cadastrada
PATCH /super/imobiliarias/1/aprovar
```

### 2. Imobiliária se Cadastra
```bash
# Auto-cadastro (não precisa login)
POST /imobiliarias
{
  "nome": "Imobiliária XYZ",
  "cnpj": "12345678000190",
  "email": "contato@xyz.com",
  "telefone": "11999999999"
}
# Status: aguardando_aprovacao
```

### 3. Admin Imobiliária Cria Hierarquia
```bash
# Criar diretor
POST /users
{
  "name": "João Diretor",
  "email": "diretor@xyz.com",
  "password": "senha123",
  "role": "diretor"
}

# Criar gerente subordinado ao diretor
POST /users
{
  "name": "Maria Gerente",
  "email": "gerente@xyz.com",
  "password": "senha123",
  "role": "gerente",
  "diretorId": 5
}

# Criar corretor subordinado ao gerente
POST /users
{
  "name": "Ana Corretora",
  "email": "corretor@xyz.com",
  "password": "senha123",
  "role": "corretor",
  "gerenteId": 6
}
```

### 4. Diretor Cria Empreendimento
```bash
POST /empreendimentos
{
  "nome": "Residencial Primavera",
  "tipoUnidade": "apartamento",
  "quantidadeUnidades": 100,
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "dataLancamento": "2025-01-01",
  "dataPrevisaoConstrucao": "2027-12-31",
  "nomeGerente1": "Carlos Silva",
  "contatoGerente1": "11988887777"
}
```

### 5. Gerente Cadastra Unidades (Financeiro)
```bash
POST /unidades
{
  "empreendimentoId": 1,
  "numero": "101",
  "valorBase": 250000,
  "juros": 15000
}
# valorTotal calculado automaticamente: 265000
```

### 6. Corretor Cria Proposta
```bash
POST /propostas
{
  "empreendimentoId": 1,
  "unidadeId": 1,
  "clienteNome": "José",
  "clienteSobrenome": "Silva",
  "clienteRg": "123456789",
  "clienteCpf": "12345678901",
  "clienteProfissao": "Engenheiro",
  "clienteRemuneracao": 8000,
  "valorAVista": 80000,
  "valor30Dias": 26500,
  "valor60Dias": 26500,
  "valor90Dias": 26500,
  "valorMensais": 3000,
  "saldoFinanciar": 105500
}
# Unidade automaticamente vira status: "reservado"
```

### 7. Gerente Aprova Proposta
```bash
PATCH /propostas/1
{
  "status": "aprovada"
}
# Unidade automaticamente vira status: "vendido"
```

---

## ✅ Sistema Pronto Para

- ✅ Escala nacional (multi-tenant)
- ✅ Milhares de imobiliárias simultâneas
- ✅ Hierarquia organizacional complexa
- ✅ Segurança enterprise-grade
- ✅ Permissões totalmente configuráveis
- ✅ Gestão completa de empreendimentos
- ✅ Propostas com múltiplas formas de pagamento
- ✅ Isolamento absoluto entre imobiliárias

---

## 🎓 Tecnologias Utilizadas

**Backend:**
- Node.js + Express
- Prisma ORM
- MySQL
- JWT Authentication
- bcrypt

**Arquitetura:**
- MVC Pattern
- Middleware chain (auth → multitenant → permissions)
- RESTful API
- Caching de permissões

---

**Desenvolvido para suportar o crescimento de imobiliárias em todo o Brasil 🇧🇷**
