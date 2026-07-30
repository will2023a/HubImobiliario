# Documento de Requisitos — Mapa Completo de Páginas do CRM Imobiliário

## Introdução

Este documento mapeia TODAS as páginas do CRM Imobiliário SaaS — tanto as existentes quanto as futuras — definindo para cada uma: propósito, campos, funcionalidades, permissões por role e conexões com outras páginas. O objetivo é servir como referência completa para o desenvolvimento do frontend do sistema.

## Glossário

- **Sistema**: O CRM Imobiliário SaaS como um todo
- **Página**: Uma view/tela renderizada no frontend React
- **Sidebar**: Menu lateral colapsável de navegação principal
- **Role**: Papel do usuário na hierarquia (super_admin, admin_imobiliaria, diretor, gerente, corretor)
- **Multi_Tenant**: Isolamento de dados por imobiliária
- **Pipeline**: Funil de vendas visual em formato Kanban
- **Inbox**: Central unificada de mensagens de todos os canais
- **Automação**: Fluxo visual programável de ações automáticas
- **Lead**: Potencial cliente captado pelo sistema
- **Corretor**: Agente/broker que atende leads e realiza vendas
- **Gerente**: Gestor de equipe de corretores
- **Diretor**: Gestor de equipe de gerentes
- **Admin_Imobiliaria**: Administrador da empresa imobiliária
- **Super_Admin**: Administrador da plataforma (dono do SaaS)

---

## Requisitos

---

### Requisito 1: Página de Login

**User Story:** Como um usuário do sistema, eu quero acessar uma página de login moderna e responsiva, para que eu possa autenticar-me no sistema de forma segura.

#### Critérios de Aceitação

1. THE Página_Login SHALL exibir campos de e-mail e senha com validação visual em tempo real
2. WHEN o usuário submeter credenciais válidas, THE Página_Login SHALL redirecionar para o Dashboard correspondente ao role do usuário
3. IF credenciais inválidas forem submetidas, THEN THE Página_Login SHALL exibir mensagem de erro específica sem revelar qual campo está incorreto
4. THE Página_Login SHALL exibir link para cadastro de nova imobiliária (RegisterImobiliaria)
5. THE Página_Login SHALL aplicar design moderno com dark theme e branding do sistema
6. WHILE o login estiver sendo processado, THE Página_Login SHALL exibir estado de loading no botão de submit

#### Campos
- E-mail (input text, obrigatório, validação de formato)
- Senha (input password, obrigatório, mínimo 6 caracteres)

#### Permissões
- Acesso público (sem autenticação)

---

### Requisito 2: Página de Cadastro de Imobiliária

**User Story:** Como um administrador de imobiliária, eu quero me cadastrar na plataforma, para que minha empresa possa utilizar o CRM.

#### Critérios de Aceitação

1. THE Página_RegisterImobiliaria SHALL exibir formulário com dados da empresa e do administrador
2. WHEN o formulário for submetido com dados válidos, THE Página_RegisterImobiliaria SHALL criar a imobiliária com status "aguardando_aprovacao"
3. WHEN o cadastro for concluído, THE Página_RegisterImobiliaria SHALL redirecionar para a página de Aguardando Aprovação
4. IF dados obrigatórios estiverem ausentes, THEN THE Página_RegisterImobiliaria SHALL destacar os campos faltantes com mensagens de validação

#### Campos
- Nome da empresa (text, obrigatório)
- CNPJ (text, obrigatório, validação de formato)
- E-mail corporativo (text, obrigatório)
- Telefone (text, obrigatório)
- Nome do administrador (text, obrigatório)
- E-mail do administrador (text, obrigatório)
- Senha (password, obrigatório, mínimo 6 caracteres)

#### Permissões
- Acesso público (sem autenticação)

---

### Requisito 3: Página de Aguardando Aprovação

**User Story:** Como um administrador de imobiliária recém-cadastrado, eu quero ver um status claro de que minha empresa está em análise, para que eu saiba que o processo está em andamento.

#### Critérios de Aceitação

1. THE Página_AguardandoAprovacao SHALL exibir mensagem informando que a imobiliária está em análise
2. THE Página_AguardandoAprovacao SHALL exibir informações de contato para suporte
3. THE Página_AguardandoAprovacao SHALL oferecer botão de logout

#### Campos
- Nenhum campo editável (página informativa)

#### Permissões
- Usuários autenticados com imobiliária em status "aguardando_aprovacao"

---

### Requisito 4: Dashboard Home

**User Story:** Como um usuário autenticado, eu quero ver um painel inicial com KPIs e atividades recentes, para que eu tenha uma visão geral do desempenho do negócio.

#### Critérios de Aceitação

1. THE Página_DashboardHome SHALL exibir cards de KPIs relevantes ao role do usuário (total de leads, propostas pendentes, vendas do mês, comissões)
2. THE Página_DashboardHome SHALL exibir gráfico de conversão de leads dos últimos 30 dias
3. THE Página_DashboardHome SHALL exibir lista de atividades recentes (últimas propostas, visitas, leads)
4. THE Página_DashboardHome SHALL exibir ranking de corretores com mais vendas no mês (visível para gerente, diretor, admin_imobiliaria)
5. WHILE o role do usuário for "corretor", THE Página_DashboardHome SHALL exibir apenas KPIs e atividades do próprio corretor
6. WHILE o role do usuário for "super_admin", THE Página_DashboardHome SHALL exibir métricas globais da plataforma (imobiliárias ativas, total de usuários, receita)

#### Campos/Componentes
- Card KPI: Leads novos (hoje/semana/mês)
- Card KPI: Propostas pendentes
- Card KPI: Vendas fechadas (mês)
- Card KPI: Taxa de conversão
- Gráfico de linha: Evolução de leads/vendas
- Lista: Atividades recentes (últimas 10)
- Tabela: Ranking corretores (top 5)

#### Permissões
- super_admin: métricas globais da plataforma
- admin_imobiliaria: métricas completas da imobiliária
- diretor: métricas dos gerentes e corretores subordinados
- gerente: métricas dos corretores subordinados
- corretor: apenas métricas próprias

---

### Requisito 5: Lista de Empreendimentos

**User Story:** Como um usuário da imobiliária, eu quero visualizar todos os empreendimentos cadastrados, para que eu possa gerenciar e acessar informações dos projetos.

#### Critérios de Aceitação

1. THE Página_EmpreendimentosList SHALL exibir empreendimentos em formato de cards com imagem, nome, cidade e estatísticas resumidas
2. THE Página_EmpreendimentosList SHALL permitir filtro por cidade, estado e tipo de unidade
3. THE Página_EmpreendimentosList SHALL exibir contadores de unidades (disponíveis, reservadas, vendidas) em cada card
4. WHEN o usuário clicar em um card, THE Página_EmpreendimentosList SHALL navegar para o Dashboard do empreendimento
5. WHERE o role permitir criação, THE Página_EmpreendimentosList SHALL exibir botão "Novo Empreendimento"

#### Permissões
- Todos os roles da imobiliária podem visualizar
- Criação: admin_imobiliaria, diretor (configurável via permissões)

---

### Requisito 6: Dashboard do Empreendimento

**User Story:** Como um usuário, eu quero ver o painel completo de um empreendimento, para que eu possa acompanhar unidades, propostas e visitas do projeto.

#### Critérios de Aceitação

1. THE Página_EmpreendimentoDashboard SHALL exibir informações gerais do empreendimento (nome, tipo, localização, datas)
2. THE Página_EmpreendimentoDashboard SHALL exibir abas para Unidades, Propostas, Visitas e Marketing
3. THE Página_EmpreendimentoDashboard SHALL exibir tabela de unidades com número, valor, status e ações
4. THE Página_EmpreendimentoDashboard SHALL exibir estatísticas visuais (% vendido, % reservado, % disponível)
5. WHERE o role permitir edição, THE Página_EmpreendimentoDashboard SHALL exibir botão "Editar Empreendimento"
6. WHEN o usuário clicar em "Nova Proposta" em uma unidade disponível, THE Página_EmpreendimentoDashboard SHALL navegar para o formulário de proposta com a unidade pré-selecionada

#### Campos/Componentes
- Header: nome, imagem, localização, datas
- Stats: cards com % disponível/reservado/vendido
- Tab Unidades: tabela (número, bloco, valor base, juros, valor total, status)
- Tab Propostas: lista de propostas vinculadas
- Tab Visitas: lista de visitas ao empreendimento
- Tab Marketing: materiais do empreendimento

#### Permissões
- Todos os roles podem visualizar
- Edição: admin_imobiliaria, diretor (configurável)
- Criação de unidades: admin_imobiliaria, diretor, gerente

---

### Requisito 7: Formulário de Empreendimento (Criar/Editar)

**User Story:** Como um diretor ou admin, eu quero criar ou editar empreendimentos, para que eu possa cadastrar novos projetos imobiliários no sistema.

#### Critérios de Aceitação

1. THE Página_EmpreendimentoForm SHALL exibir formulário com todos os campos do empreendimento
2. WHEN em modo edição, THE Página_EmpreendimentoForm SHALL pré-carregar os dados existentes do empreendimento
3. WHEN o formulário for submetido com dados válidos, THE Página_EmpreendimentoForm SHALL salvar e redirecionar para o Dashboard do empreendimento
4. IF campos obrigatórios estiverem ausentes, THEN THE Página_EmpreendimentoForm SHALL exibir mensagens de validação nos campos
5. THE Página_EmpreendimentoForm SHALL permitir upload de imagem do empreendimento

#### Campos
- Nome (text, obrigatório)
- Tipo de unidade (select: lote/casa/apartamento, obrigatório)
- Quantidade de unidades (number, obrigatório)
- Imagem (file upload, opcional)
- Bairro (text, obrigatório)
- Cidade (text, obrigatório)
- Estado (select, obrigatório)
- Data de lançamento (date, opcional)
- Data previsão construção (date, opcional)
- Gerentes de produto (até 5): nome + contato

#### Permissões
- admin_imobiliaria, diretor: criar e editar
- gerente: editar (configurável)

---

### Requisito 8: Lista de Propostas

**User Story:** Como um usuário da imobiliária, eu quero visualizar todas as propostas com filtros avançados, para que eu possa acompanhar o andamento das vendas.

#### Critérios de Aceitação

1. THE Página_PropostasList SHALL exibir tabela com todas as propostas visíveis ao role do usuário
2. THE Página_PropostasList SHALL permitir filtros por status (pendente, aprovada, rejeitada), empreendimento, corretor e período
3. THE Página_PropostasList SHALL exibir para cada proposta: cliente, empreendimento, unidade, corretor, valor total, status e data
4. WHEN o usuário clicar em uma proposta, THE Página_PropostasList SHALL exibir detalhes completos em modal ou página dedicada
5. WHERE o role for gerente ou superior, THE Página_PropostasList SHALL exibir botões de aprovar/rejeitar para propostas pendentes
6. THE Página_PropostasList SHALL exibir paginação para listas grandes

#### Permissões
- corretor: apenas suas propostas
- gerente: propostas de seus corretores
- diretor: propostas dos gerentes/corretores subordinados
- admin_imobiliaria: todas as propostas da imobiliária
- super_admin: todas as propostas (cross-tenant)

---

### Requisito 9: Formulário de Proposta (Criar/Editar)

**User Story:** Como um corretor, eu quero criar propostas de compra para meus clientes, para que eu possa formalizar o interesse de compra de uma unidade.

#### Critérios de Aceitação

1. THE Página_PropostaForm SHALL exibir seções para dados do cliente, seleção de unidade e formas de pagamento
2. WHEN o usuário selecionar um empreendimento, THE Página_PropostaForm SHALL carregar as unidades disponíveis do empreendimento
3. WHEN o usuário selecionar uma unidade, THE Página_PropostaForm SHALL exibir o valor total da unidade automaticamente
4. WHEN a proposta for criada, THE Sistema SHALL alterar o status da unidade para "reservado"
5. IF campos obrigatórios do cliente estiverem vazios, THEN THE Página_PropostaForm SHALL bloquear o envio e exibir validações

#### Campos
- Seção Cliente: nome, sobrenome, RG, CPF, profissão, remuneração
- Seção Unidade: select empreendimento, select unidade (filtra disponíveis), valor total (readonly)
- Seção Pagamento: à vista, 30 dias, 60 dias, 90 dias, mensais, semestrais, anuais, parcela única, saldo a financiar
- Observações (textarea, opcional)

#### Permissões
- corretor, gerente, diretor, admin_imobiliaria: criar propostas

---

### Requisito 10: Lista de Visitas

**User Story:** Como um usuário, eu quero visualizar todas as visitas registradas, para que eu possa acompanhar o interesse dos clientes nos empreendimentos.

#### Critérios de Aceitação

1. THE Página_VisitasList SHALL exibir tabela com visitas filtráveis por empreendimento, tipo (agendada/espontânea) e período
2. THE Página_VisitasList SHALL exibir para cada visita: visitante, empreendimento, unidade, atendente, data e tipo
3. THE Página_VisitasList SHALL permitir busca por nome do visitante ou telefone
4. WHERE o role permitir criação, THE Página_VisitasList SHALL exibir botão "Nova Visita"

#### Permissões
- Todos os roles podem visualizar (filtrado por hierarquia)
- Criação: todos os roles

---

### Requisito 11: Formulário de Visita (Criar/Editar)

**User Story:** Como um corretor ou atendente, eu quero registrar visitas de clientes aos empreendimentos, para que eu possa manter histórico de interesse.

#### Critérios de Aceitação

1. THE Página_VisitaForm SHALL exibir campos para dados do visitante, empreendimento, unidade e observações
2. WHEN o empreendimento for selecionado, THE Página_VisitaForm SHALL carregar as unidades disponíveis para seleção opcional
3. THE Página_VisitaForm SHALL preencher automaticamente o atendente com o usuário logado
4. WHEN a visita for salva, THE Página_VisitaForm SHALL redirecionar para a lista de visitas

#### Campos
- Nome do visitante (text, obrigatório)
- Telefone (text, obrigatório)
- E-mail (text, opcional)
- Tipo (select: agendada/espontânea, obrigatório)
- Data da visita (datetime, obrigatório, default: agora)
- Empreendimento (select, obrigatório)
- Unidade (select, opcional)
- Observações (textarea, opcional)

#### Permissões
- Todos os roles podem criar visitas

---

### Requisito 12: Lista de Materiais de Marketing

**User Story:** Como um gerente ou admin, eu quero gerenciar materiais de marketing dos empreendimentos, para que eu possa controlar estoque e distribuição de materiais físicos.

#### Critérios de Aceitação

1. THE Página_MarketingList SHALL exibir tabela com materiais, agrupáveis por empreendimento
2. THE Página_MarketingList SHALL exibir para cada material: tipo, empreendimento, estoque inicial, estoque atual e total dispensado
3. WHERE o estoque atual for menor que 20% do estoque inicial, THE Página_MarketingList SHALL destacar o material com alerta visual
4. WHERE o role permitir criação, THE Página_MarketingList SHALL exibir botão "Novo Material"

#### Permissões
- admin_imobiliaria, diretor, gerente: visualizar e criar
- corretor: visualizar apenas

---

### Requisito 13: Formulário de Material de Marketing

**User Story:** Como um gerente, eu quero cadastrar novos materiais de marketing, para que eu possa controlar o estoque de banners e folders dos empreendimentos.

#### Critérios de Aceitação

1. THE Página_MarketingForm SHALL exibir campos para tipo de material, empreendimento e quantidade
2. WHEN o formulário for salvo, THE Sistema SHALL registrar o material com estoque atual igual à quantidade inicial
3. IF a quantidade for zero ou negativa, THEN THE Página_MarketingForm SHALL exibir erro de validação

#### Campos
- Tipo (select: banner/folder, obrigatório)
- Empreendimento (select, obrigatório)
- Quantidade inicial (number, obrigatório, mínimo 1)
- Descrição (textarea, opcional)

#### Permissões
- admin_imobiliaria, diretor, gerente: criar e editar

---

### Requisito 14: Dispensar Material

**User Story:** Como um corretor ou gerente, eu quero registrar a dispensação de materiais, para que o controle de estoque se mantenha atualizado.

#### Critérios de Aceitação

1. THE Página_DispensarMaterial SHALL exibir formulário para registro de dispensação de material
2. THE Página_DispensarMaterial SHALL exibir o estoque atual disponível do material selecionado
3. IF a quantidade solicitada for maior que o estoque disponível, THEN THE Página_DispensarMaterial SHALL bloquear a dispensação e exibir erro
4. WHEN a dispensação for registrada, THE Sistema SHALL decrementar o estoque atual do material

#### Campos
- Material (select ou pré-selecionado via URL)
- Quantidade (number, obrigatório, mínimo 1)
- Dispensado para (text, obrigatório — nome do destinatário)
- Observações (textarea, opcional)

#### Permissões
- Todos os roles da imobiliária podem dispensar

---

### Requisito 15: Página de Equipe

**User Story:** Como um admin ou diretor, eu quero visualizar a estrutura hierárquica da equipe, para que eu possa gerenciar subordinados e entender a organização.

#### Critérios de Aceitação

1. THE Página_Equipe SHALL exibir a hierarquia organizacional em formato de árvore ou organograma (diretor → gerentes → corretores)
2. THE Página_Equipe SHALL permitir filtro e busca por nome ou role
3. WHERE o role permitir criação de usuários, THE Página_Equipe SHALL exibir botão "Adicionar Membro"
4. WHEN o usuário clicar em um membro da equipe, THE Página_Equipe SHALL exibir detalhes e opções de edição
5. THE Página_Equipe SHALL exibir métricas resumidas por membro (leads ativos, propostas, vendas)

#### Permissões
- admin_imobiliaria: ver toda a equipe, criar qualquer role
- diretor: ver gerentes e corretores subordinados
- gerente: ver corretores subordinados
- corretor: sem acesso à página

---

### Requisito 16: Página de Permissões

**User Story:** Como um admin da imobiliária, eu quero configurar permissões granulares por role, para que eu possa controlar o que cada nível hierárquico pode fazer no sistema.

#### Critérios de Aceitação

1. THE Página_Permissoes SHALL exibir matriz de permissões (linhas: roles, colunas: recursos × ações)
2. THE Página_Permissoes SHALL permitir toggle (ativar/desativar) de cada permissão individualmente
3. WHEN uma permissão for alterada, THE Sistema SHALL salvar a alteração imediatamente (save automático)
4. THE Página_Permissoes SHALL exibir os recursos: empreendimentos, propostas, leads, relatórios, visitas, marketing
5. THE Página_Permissoes SHALL exibir as ações: criar, ler, atualizar, deletar

#### Permissões
- super_admin, admin_imobiliaria: acesso total
- demais roles: sem acesso

---

### Requisito 17: Lista de Leads

**User Story:** Como um corretor ou gestor, eu quero visualizar e gerenciar meus leads, para que eu possa acompanhar potenciais clientes e seu progresso no funil.

#### Critérios de Aceitação

1. THE Página_LeadsList SHALL exibir tabela com leads filtráveis por status, origem, corretor e período
2. THE Página_LeadsList SHALL permitir busca por nome, e-mail ou telefone do lead
3. THE Página_LeadsList SHALL exibir para cada lead: nome, telefone, origem, status, corretor responsável e data de criação
4. WHEN o usuário clicar em um lead, THE Página_LeadsList SHALL navegar para a página de detalhe do lead
5. WHERE o role permitir criação, THE Página_LeadsList SHALL exibir botão "Novo Lead"
6. THE Página_LeadsList SHALL exibir paginação e contador total de registros

#### Permissões
- corretor: apenas seus leads
- gerente: leads de seus corretores
- diretor: todos os leads dos subordinados
- admin_imobiliaria: todos os leads da imobiliária

---

### Requisito 18: Detalhe do Lead

**User Story:** Como um corretor, eu quero ver todas as informações e histórico de um lead, para que eu possa personalizar o atendimento e acompanhar a evolução.

#### Critérios de Aceitação

1. THE Página_LeadDetail SHALL exibir dados completos do lead (nome, contato, origem, status, corretor)
2. THE Página_LeadDetail SHALL exibir timeline de atendimentos/interações com o lead
3. THE Página_LeadDetail SHALL permitir adicionar novo atendimento/nota ao histórico
4. THE Página_LeadDetail SHALL permitir alterar o status do lead
5. WHERE o lead possuir propostas vinculadas, THE Página_LeadDetail SHALL exibir lista de propostas relacionadas
6. WHERE o role permitir transferência, THE Página_LeadDetail SHALL exibir opção de transferir lead para outro corretor

#### Campos/Componentes
- Header: nome, telefone, e-mail, origem, status (badge colorido)
- Seção: Timeline de atendimentos (mensagens, notas, ações)
- Form: Novo atendimento (textarea + botão enviar)
- Lista: Propostas vinculadas
- Ações: Editar, Transferir, Alterar Status

#### Permissões
- corretor: seus leads apenas
- gerente+: leads de subordinados + opção de transferência

---

### Requisito 19: Formulário de Lead (Criar/Editar)

**User Story:** Como um corretor ou atendente, eu quero cadastrar novos leads manualmente, para que eu possa registrar contatos captados offline ou por indicação.

#### Critérios de Aceitação

1. THE Página_LeadForm SHALL exibir formulário com dados de contato e origem do lead
2. WHEN o formulário for salvo, THE Sistema SHALL atribuir o lead ao corretor logado (se role for corretor)
3. WHERE o role for gerente ou superior, THE Página_LeadForm SHALL permitir selecionar o corretor responsável
4. IF o telefone já existir no sistema, THEN THE Página_LeadForm SHALL alertar sobre possível duplicata

#### Campos
- Nome (text, obrigatório)
- E-mail (text, opcional)
- Telefone (text, obrigatório)
- Origem (select: site, indicação, WhatsApp, Instagram, Facebook, portais, manual, obrigatório)
- Status (select: novo, em_contato, qualificado, proposta, fechado, perdido)
- Corretor responsável (select, visível para gerente+)

#### Permissões
- Todos os roles podem criar leads

---

### Requisito 20: Lista de Imóveis

**User Story:** Como um usuário, eu quero visualizar o catálogo de imóveis avulsos da imobiliária, para que eu possa encontrar opções para meus clientes.

#### Critérios de Aceitação

1. THE Página_ImoveisList SHALL exibir imóveis em grid de cards com foto, título, valor, cidade e status
2. THE Página_ImoveisList SHALL permitir filtros por cidade, estado, faixa de valor e status
3. THE Página_ImoveisList SHALL permitir busca por título ou endereço
4. THE Página_ImoveisList SHALL exibir paginação para listas grandes
5. WHERE o role permitir criação, THE Página_ImoveisList SHALL exibir botão "Novo Imóvel"

#### Permissões
- Todos os roles podem visualizar
- Criação: admin_imobiliaria, diretor, gerente

---

### Requisito 21: Formulário de Imóvel (Criar/Editar)

**User Story:** Como um gestor, eu quero cadastrar imóveis avulsos no sistema, para que minha equipe possa oferecê-los aos clientes.

#### Critérios de Aceitação

1. THE Página_ImovelForm SHALL exibir formulário completo com dados do imóvel
2. WHEN em modo edição, THE Página_ImovelForm SHALL pré-carregar dados existentes
3. IF campos obrigatórios estiverem vazios, THEN THE Página_ImovelForm SHALL exibir validações

#### Campos
- Título (text, obrigatório)
- Descrição (textarea, obrigatório)
- Valor (number/currency, obrigatório)
- Endereço (text, obrigatório)
- Cidade (text, obrigatório)
- Estado (select, obrigatório)
- Status (select: disponível, reservado, vendido, inativo)

#### Permissões
- admin_imobiliaria, diretor, gerente: criar e editar

---

### Requisito 22: Lista de Usuários

**User Story:** Como um admin, eu quero gerenciar os usuários da minha imobiliária, para que eu possa criar, editar e desativar contas.

#### Critérios de Aceitação

1. THE Página_UsersList SHALL exibir tabela com todos os usuários da imobiliária, filtráveis por role
2. THE Página_UsersList SHALL exibir para cada usuário: nome, e-mail, role, superior hierárquico e data de criação
3. THE Página_UsersList SHALL permitir busca por nome ou e-mail
4. WHERE o role permitir criação de usuários, THE Página_UsersList SHALL exibir botão "Novo Usuário"
5. THE Página_UsersList SHALL permitir ações de editar e excluir em cada linha

#### Permissões
- admin_imobiliaria: ver e gerenciar todos os usuários
- diretor: ver gerentes e corretores sob sua responsabilidade
- gerente: ver corretores sob sua responsabilidade

---

### Requisito 23: Formulário de Usuário (Criar/Editar)

**User Story:** Como um admin, eu quero criar novos usuários com roles específicos, para que eu possa expandir a equipe da imobiliária.

#### Critérios de Aceitação

1. THE Página_UserForm SHALL exibir formulário com dados do usuário e seleção de role
2. WHEN o role selecionado for "gerente", THE Página_UserForm SHALL exibir select de diretor responsável
3. WHEN o role selecionado for "corretor", THE Página_UserForm SHALL exibir select de gerente responsável
4. THE Página_UserForm SHALL validar e-mail único no sistema
5. IF a senha tiver menos de 6 caracteres, THEN THE Página_UserForm SHALL exibir erro de validação

#### Campos
- Nome (text, obrigatório)
- E-mail (text, obrigatório, único)
- Senha (password, obrigatório em criação, opcional em edição)
- Role (select: diretor, gerente, corretor)
- Diretor responsável (select, visível quando role = gerente)
- Gerente responsável (select, visível quando role = corretor)

#### Permissões
- admin_imobiliaria: criar qualquer role abaixo de admin
- diretor: criar gerentes e corretores

---

### Requisito 24: Painel Super Admin — Lista de Imobiliárias

**User Story:** Como super_admin, eu quero visualizar e gerenciar todas as imobiliárias da plataforma, para que eu possa aprovar, suspender e monitorar o uso.

#### Critérios de Aceitação

1. THE Página_SuperAdmin_Imobiliarias SHALL exibir tabela com todas as imobiliárias cadastradas
2. THE Página_SuperAdmin_Imobiliarias SHALL permitir filtro por status (ativa, inativa, aguardando_aprovacao)
3. THE Página_SuperAdmin_Imobiliarias SHALL exibir para cada imobiliária: nome, CNPJ, e-mail, plano, status, data de criação e total de usuários
4. THE Página_SuperAdmin_Imobiliarias SHALL permitir ações de aprovar, suspender e visualizar detalhes
5. WHEN o super_admin clicar em "Aprovar", THE Sistema SHALL alterar o status da imobiliária para "ativa"

#### Permissões
- super_admin: acesso exclusivo

---

## MÓDULOS FUTUROS (Novas Páginas)

---

### Requisito 25: Pipeline CRM (Kanban)

**User Story:** Como um corretor ou gestor, eu quero visualizar meus leads em um quadro Kanban, para que eu possa gerenciar o funil de vendas de forma visual e intuitiva.

#### Critérios de Aceitação

1. THE Página_Pipeline SHALL exibir colunas configuráveis representando estágios do funil (Novo, Contato, Qualificado, Visita, Proposta, Fechado, Perdido)
2. THE Página_Pipeline SHALL permitir arrastar e soltar (drag & drop) cards de leads entre colunas
3. WHEN um card for movido para outra coluna, THE Sistema SHALL atualizar o status do lead automaticamente
4. THE Página_Pipeline SHALL exibir em cada card: nome do lead, telefone, temperatura (quente/morno/frio) e tempo no estágio
5. THE Página_Pipeline SHALL permitir filtros por corretor, temperatura e origem
6. THE Página_Pipeline SHALL exibir contadores de leads e valor potencial em cada coluna
7. WHEN o usuário clicar em um card, THE Página_Pipeline SHALL abrir painel lateral com detalhes do lead e ações rápidas
8. WHERE o role for gerente ou superior, THE Página_Pipeline SHALL permitir visualizar pipeline de toda a equipe

#### Campos/Componentes
- Colunas Kanban configuráveis (mínimo 5 estágios)
- Cards de lead (nome, telefone, badge temperatura, badge origem, dias no estágio)
- Painel lateral: detalhes + timeline + ações rápidas
- Filtros: corretor, temperatura, origem, período
- Contadores por coluna (quantidade + valor potencial)

#### Permissões
- corretor: apenas seus leads no pipeline
- gerente: pipeline de seus corretores (com filtro por corretor)
- diretor: pipeline de todos subordinados
- admin_imobiliaria: pipeline completo da imobiliária

---

### Requisito 26: Inbox Unificado

**User Story:** Como um corretor, eu quero ter uma caixa de entrada única para todas as mensagens (WhatsApp, Instagram, Facebook, e-mail), para que eu não perca nenhum contato e possa responder rapidamente.

#### Critérios de Aceitação

1. THE Página_Inbox SHALL exibir lista de conversas à esquerda e chat ativo à direita (layout split)
2. THE Página_Inbox SHALL exibir badge com canal de origem em cada conversa (WhatsApp, Instagram, Facebook, E-mail, Chat)
3. THE Página_Inbox SHALL atualizar mensagens em tempo real via WebSocket
4. WHEN uma nova mensagem chegar, THE Página_Inbox SHALL mover a conversa para o topo da lista e exibir notificação
5. THE Página_Inbox SHALL permitir filtro por canal, status (aberta, pendente, resolvida) e corretor
6. THE Página_Inbox SHALL exibir informações do lead/contato no painel direito (dados, histórico, tags)
7. WHERE a IA estiver habilitada, THE Página_Inbox SHALL exibir sugestões de resposta geradas por IA
8. THE Página_Inbox SHALL permitir transferir conversa para outro corretor
9. THE Página_Inbox SHALL suportar envio de mensagens de texto, imagens, documentos e áudios
10. THE Página_Inbox SHALL vincular automaticamente conversas a leads existentes por número de telefone ou e-mail

#### Campos/Componentes
- Lista de conversas (nome, última mensagem, horário, canal, status)
- Área de chat (mensagens com timestamp, status de leitura)
- Input de mensagem (text, emoji, anexos, áudio)
- Painel do contato (dados do lead, tags, notas, histórico)
- Barra de filtros (canal, status, corretor)
- Sugestões IA (cards com respostas sugeridas)

#### Permissões
- corretor: conversas atribuídas a ele
- gerente: conversas de sua equipe (pode reatribuir)
- admin_imobiliaria: todas as conversas

---

### Requisito 27: Configuração de Canais de Comunicação

**User Story:** Como um admin, eu quero configurar os canais de comunicação (WhatsApp, Instagram, etc.), para que as mensagens dos clientes cheguem ao Inbox.

#### Critérios de Aceitação

1. THE Página_ConfigCanais SHALL exibir lista de canais disponíveis com status de conexão (conectado/desconectado)
2. THE Página_ConfigCanais SHALL permitir configurar a conexão WhatsApp via Evolution API (QR Code ou token)
3. THE Página_ConfigCanais SHALL permitir configurar Instagram e Facebook via Meta Graph API
4. THE Página_ConfigCanais SHALL permitir configurar servidor SMTP/IMAP para e-mail
5. WHEN um canal for conectado com sucesso, THE Página_ConfigCanais SHALL exibir status "conectado" com indicador verde
6. IF a conexão falhar, THEN THE Página_ConfigCanais SHALL exibir mensagem de erro e instruções de resolução

#### Permissões
- admin_imobiliaria: acesso exclusivo para configuração de canais

---

### Requisito 28: Painel de IA — Configurações e Monitoramento

**User Story:** Como um admin, eu quero configurar e monitorar os recursos de IA do sistema, para que eu possa definir comportamentos automáticos e acompanhar a performance.

#### Critérios de Aceitação

1. THE Página_IAConfig SHALL exibir toggle de ativação/desativação da IA para cada funcionalidade (atendimento, qualificação, sugestões)
2. THE Página_IAConfig SHALL permitir configurar o prompt/personalidade da IA para atendimento automático
3. THE Página_IAConfig SHALL exibir métricas de uso da IA (mensagens respondidas, leads qualificados, sugestões aceitas)
4. THE Página_IAConfig SHALL permitir definir horários em que a IA responde automaticamente (fora do horário comercial)
5. THE Página_IAConfig SHALL permitir configurar limites de uso (tokens/mês) para controle de custos
6. WHILE a IA estiver em modo automático, THE Página_IAConfig SHALL exibir indicador visual "IA Ativa"

#### Permissões
- admin_imobiliaria: acesso total para configuração
- diretor, gerente: visualizar métricas apenas

---

### Requisito 29: Automações — Lista de Fluxos

**User Story:** Como um admin ou gestor, eu quero visualizar e gerenciar fluxos de automação, para que eu possa automatizar processos repetitivos do CRM.

#### Critérios de Aceitação

1. THE Página_AutomacoesList SHALL exibir lista de fluxos com nome, status (ativo/inativo/rascunho), gatilho, e data de última execução
2. THE Página_AutomacoesList SHALL permitir ativar/desativar fluxos com toggle
3. THE Página_AutomacoesList SHALL exibir métricas de cada fluxo (execuções, taxa de sucesso)
4. WHERE o role permitir criação, THE Página_AutomacoesList SHALL exibir botão "Novo Fluxo"
5. THE Página_AutomacoesList SHALL exibir templates prontos para criação rápida (ex: follow-up 24h, qualificação automática, boas-vindas)

#### Permissões
- admin_imobiliaria: criar, editar, ativar/desativar todos os fluxos
- diretor, gerente: visualizar e usar templates

---

### Requisito 30: Automações — Editor Visual de Fluxos

**User Story:** Como um admin, eu quero criar fluxos de automação de forma visual (drag & drop), para que eu possa definir regras sem precisar programar.

#### Critérios de Aceitação

1. THE Página_AutomacoesEditor SHALL exibir canvas com nós conectáveis via drag & drop (similar ao n8n/React Flow)
2. THE Página_AutomacoesEditor SHALL disponibilizar nós de tipo: Gatilho, Condição, Espera, Ação e IA
3. WHEN o usuário arrastar um nó para o canvas, THE Página_AutomacoesEditor SHALL exibir painel de configuração do nó
4. THE Página_AutomacoesEditor SHALL permitir conectar nós com linhas direcionais definindo o fluxo de execução
5. THE Página_AutomacoesEditor SHALL validar o fluxo antes de salvar (gatilho obrigatório, conexões válidas)
6. THE Página_AutomacoesEditor SHALL permitir testar o fluxo com dados simulados antes de ativar
7. IF o fluxo possuir erros de validação, THEN THE Página_AutomacoesEditor SHALL destacar os nós com problema

#### Tipos de Nós
- Gatilho: novo lead, lead mudou de estágio, mensagem recebida, tempo decorrido, data específica
- Condição: if/else baseado em campos do lead (temperatura, origem, tempo sem contato)
- Espera: aguardar X minutos/horas/dias
- Ação: enviar mensagem WhatsApp, enviar e-mail, mover lead no pipeline, criar tarefa, atribuir corretor, adicionar tag
- IA: decisão inteligente (qualificar lead, gerar resposta, classificar intenção)

#### Permissões
- admin_imobiliaria: acesso total ao editor
- diretor: criar e editar fluxos (configurável)

---

### Requisito 31: Agenda — Calendário

**User Story:** Como um corretor ou gestor, eu quero visualizar minha agenda em formato de calendário, para que eu possa gerenciar visitas, tarefas e compromissos.

#### Critérios de Aceitação

1. THE Página_Agenda SHALL exibir calendário com views: dia, semana e mês
2. THE Página_Agenda SHALL exibir visitas, tarefas e eventos com cores distintas por tipo
3. WHEN o usuário clicar em um horário vazio, THE Página_Agenda SHALL abrir formulário para criar novo evento
4. WHEN o usuário clicar em um evento existente, THE Página_Agenda SHALL exibir detalhes e opções (editar, cancelar)
5. THE Página_Agenda SHALL permitir arrastar eventos para reagendar (drag & drop entre horários)
6. WHERE a integração com Google Calendar estiver ativa, THE Página_Agenda SHALL sincronizar eventos bidirecionalmente
7. THE Página_Agenda SHALL exibir lembretes com antecedência configurável (15min, 30min, 1h, 1dia)

#### Campos/Componentes
- Calendário (dia/semana/mês)
- Cards de eventos (título, horário, tipo, lead vinculado)
- Mini formulário de criação rápida
- Filtros: tipo (visita, tarefa, evento), corretor
- Indicadores: conflitos de horário

#### Permissões
- corretor: agenda própria
- gerente: agenda de seus corretores
- diretor: agenda de todos subordinados
- admin_imobiliaria: agenda de toda a imobiliária

---

### Requisito 32: Campanhas de Marketing Digital

**User Story:** Como um admin ou gestor de marketing, eu quero gerenciar campanhas de mídia paga integradas ao CRM, para que eu possa rastrear leads desde a origem e medir ROI.

#### Critérios de Aceitação

1. THE Página_Campanhas SHALL exibir lista de campanhas ativas e encerradas com métricas (impressões, cliques, leads gerados, custo por lead)
2. THE Página_Campanhas SHALL permitir criar nova campanha com integração Meta Ads ou Google Ads
3. THE Página_Campanhas SHALL rastrear UTMs automaticamente para atribuir leads à campanha de origem
4. THE Página_Campanhas SHALL exibir gráfico de performance (leads gerados x investimento) ao longo do tempo
5. WHEN um lead entrar via campanha rastreada, THE Sistema SHALL vincular automaticamente o lead à campanha

#### Campos/Componentes
- Lista de campanhas (nome, plataforma, status, budget, leads, custo/lead)
- Formulário de criação (nome, plataforma, UTMs, budget, período)
- Gráficos de performance
- Filtros: plataforma, período, status

#### Permissões
- admin_imobiliaria, diretor: criar e gerenciar campanhas
- gerente: visualizar métricas
- corretor: sem acesso

---

### Requisito 33: Landing Pages

**User Story:** Como um gestor de marketing, eu quero criar landing pages para captura de leads, para que campanhas possam direcionar tráfego e converter visitantes em leads automaticamente.

#### Critérios de Aceitação

1. THE Página_LandingPages SHALL exibir lista de landing pages criadas com status (publicada, rascunho) e métricas (visitas, conversões, taxa)
2. THE Página_LandingPages SHALL permitir criar nova landing page com builder visual (drag & drop de blocos)
3. THE Página_LandingPages SHALL gerar URL única para cada landing page
4. WHEN um visitante preencher o formulário da landing page, THE Sistema SHALL criar um lead automaticamente com a origem "landing_page"
5. THE Página_LandingPages SHALL permitir vincular landing page a um empreendimento específico

#### Permissões
- admin_imobiliaria, diretor: criar e editar
- gerente: visualizar métricas

---

### Requisito 34: Financeiro — Comissões

**User Story:** Como um admin ou diretor, eu quero visualizar e gerenciar comissões de vendas, para que eu possa calcular e pagar a equipe corretamente.

#### Critérios de Aceitação

1. THE Página_Comissoes SHALL exibir tabela de comissões calculadas com base em propostas aprovadas
2. THE Página_Comissoes SHALL calcular comissão por venda de acordo com regras configuráveis (% por role: corretor, gerente, diretor)
3. THE Página_Comissoes SHALL permitir filtro por período, corretor e empreendimento
4. THE Página_Comissoes SHALL exibir totais por período: valor total vendido, total de comissões, comissões pagas e pendentes
5. THE Página_Comissoes SHALL permitir marcar comissões como "paga" com registro de data de pagamento
6. WHILE uma proposta estiver com status "aprovada", THE Sistema SHALL calcular a comissão automaticamente

#### Campos/Componentes
- Tabela: proposta, corretor, valor da venda, % comissão, valor comissão, status (pendente/paga)
- Filtros: período, corretor, empreendimento, status
- Cards resumo: total vendido, total comissões, pendentes, pagas
- Configuração: % de comissão por role

#### Permissões
- admin_imobiliaria: acesso total, pode marcar como pago
- diretor: visualizar comissões de subordinados
- gerente: visualizar comissões de sua equipe
- corretor: visualizar apenas suas comissões

---

### Requisito 35: Financeiro — Contratos

**User Story:** Como um admin, eu quero gerar contratos digitais a partir de propostas aprovadas, para que eu possa formalizar a venda com assinatura eletrônica.

#### Critérios de Aceitação

1. THE Página_Contratos SHALL exibir lista de contratos com status (rascunho, enviado, assinado, cancelado)
2. WHEN uma proposta for aprovada, THE Página_Contratos SHALL permitir gerar contrato a partir de template pré-configurado
3. THE Página_Contratos SHALL preencher automaticamente dados do cliente, unidade e condições de pagamento a partir da proposta
4. THE Página_Contratos SHALL permitir enviar contrato para assinatura digital do cliente
5. THE Página_Contratos SHALL gerar PDF do contrato assinado

#### Permissões
- admin_imobiliaria: criar, enviar e gerenciar contratos
- diretor: visualizar contratos
- gerente: visualizar contratos de sua equipe

---

### Requisito 36: Analytics / BI — Dashboard Analítico

**User Story:** Como um gestor, eu quero acessar um painel de Business Intelligence com gráficos e métricas avançadas, para que eu possa tomar decisões baseadas em dados.

#### Critérios de Aceitação

1. THE Página_Analytics SHALL exibir gráficos interativos de: conversão do funil, vendas por período, leads por origem, performance por corretor
2. THE Página_Analytics SHALL permitir selecionar período de análise (7 dias, 30 dias, 90 dias, customizado)
3. THE Página_Analytics SHALL exibir comparativo com período anterior (crescimento/queda em %)
4. THE Página_Analytics SHALL exibir ranking de corretores por métricas (vendas, leads convertidos, tempo médio de resposta)
5. WHERE a IA estiver habilitada, THE Página_Analytics SHALL exibir insights automáticos ("Corretor X teve queda de 30% esta semana", "Leads do Instagram convertem 2x mais")
6. THE Página_Analytics SHALL permitir exportar relatórios em PDF e Excel

#### Campos/Componentes
- Gráfico funil: leads → contato → qualificado → proposta → venda
- Gráfico linha: evolução temporal (leads, vendas, receita)
- Gráfico pizza: leads por origem
- Gráfico barras: performance por corretor
- Cards IA: insights automáticos
- Tabela: ranking de corretores
- Filtros: período, empreendimento, corretor, origem
- Ações: exportar PDF, exportar Excel

#### Permissões
- admin_imobiliaria: analytics completo
- diretor: analytics de subordinados
- gerente: analytics de sua equipe
- corretor: apenas métricas próprias (resumidas)

---

### Requisito 37: Forecasting / Previsões

**User Story:** Como um diretor ou admin, eu quero ver previsões de vendas baseadas em IA, para que eu possa planejar metas e recursos.

#### Critérios de Aceitação

1. THE Página_Forecasting SHALL exibir previsão de fechamento por lead (probabilidade em %) baseada em dados históricos
2. THE Página_Forecasting SHALL exibir projeção de receita para os próximos 30/60/90 dias
3. THE Página_Forecasting SHALL exibir alertas de leads com risco de perda (sem contato há muito tempo, temperatura caindo)
4. THE Página_Forecasting SHALL permitir configurar metas mensais por equipe e por corretor

#### Permissões
- admin_imobiliaria, diretor: acesso total
- gerente: previsões de sua equipe

---

### Requisito 38: Configurações da Imobiliária

**User Story:** Como um admin da imobiliária, eu quero acessar uma página central de configurações, para que eu possa personalizar o sistema para minha empresa.

#### Critérios de Aceitação

1. THE Página_Configuracoes SHALL exibir seções organizadas: Dados da Empresa, Canais, IA, Integrações, Notificações e Plano
2. THE Página_Configuracoes SHALL permitir editar dados da imobiliária (nome, CNPJ, logo, cores do tema)
3. THE Página_Configuracoes SHALL exibir status do plano atual e opções de upgrade
4. THE Página_Configuracoes SHALL permitir configurar notificações (quais eventos geram notificação e para quem)
5. THE Página_Configuracoes SHALL permitir configurar horário de funcionamento (para regras de IA e automações)

#### Permissões
- admin_imobiliaria: acesso total
- demais roles: sem acesso

---

### Requisito 39: Notificações

**User Story:** Como um usuário, eu quero receber e visualizar notificações em tempo real, para que eu não perca eventos importantes do sistema.

#### Critérios de Aceitação

1. THE Componente_Notificacoes SHALL exibir sino de notificações no header com badge contador de não-lidas
2. WHEN o usuário clicar no sino, THE Componente_Notificacoes SHALL exibir dropdown com lista de notificações recentes
3. THE Componente_Notificacoes SHALL exibir notificações para: nova mensagem, nova proposta, proposta aprovada/rejeitada, novo lead atribuído, lembrete de tarefa
4. WHEN uma nova notificação chegar, THE Sistema SHALL atualizar o contador em tempo real via WebSocket
5. THE Página_Notificacoes SHALL exibir histórico completo de notificações com filtros e paginação

#### Permissões
- Todos os roles recebem notificações relevantes ao seu escopo

---

### Requisito 40: Perfil do Usuário

**User Story:** Como um usuário, eu quero editar meu perfil e preferências, para que eu possa manter meus dados atualizados e personalizar minha experiência.

#### Critérios de Aceitação

1. THE Página_Perfil SHALL exibir dados do usuário logado (nome, e-mail, role, foto)
2. THE Página_Perfil SHALL permitir alterar nome, foto e senha
3. THE Página_Perfil SHALL permitir configurar preferências de notificação (e-mail, push, WhatsApp)
4. THE Página_Perfil SHALL exibir informações da imobiliária e do superior hierárquico

#### Permissões
- Todos os roles podem acessar e editar seu próprio perfil

---

### Requisito 41: Busca Global

**User Story:** Como um usuário, eu quero buscar qualquer informação no sistema de forma rápida, para que eu possa encontrar leads, imóveis, empreendimentos ou propostas sem navegar por várias páginas.

#### Critérios de Aceitação

1. THE Componente_BuscaGlobal SHALL exibir campo de busca no header acessível via atalho de teclado (Ctrl+K)
2. WHEN o usuário digitar no campo de busca, THE Componente_BuscaGlobal SHALL exibir resultados em tempo real agrupados por tipo (leads, imóveis, empreendimentos, propostas)
3. THE Componente_BuscaGlobal SHALL buscar por nome, telefone, e-mail, endereço e CPF
4. WHERE a IA estiver habilitada, THE Componente_BuscaGlobal SHALL suportar busca em linguagem natural ("leads quentes sem contato há 3 dias")
5. WHEN o usuário selecionar um resultado, THE Componente_BuscaGlobal SHALL navegar para a página de detalhe do item

#### Permissões
- Todos os roles, respeitando o escopo de visibilidade do role

---

### Requisito 42: Tarefas e Follow-ups

**User Story:** Como um corretor ou gestor, eu quero gerenciar tarefas e follow-ups vinculados a leads, para que eu não esqueça de dar retorno ou realizar ações importantes.

#### Critérios de Aceitação

1. THE Página_Tarefas SHALL exibir lista de tarefas pendentes ordenadas por prazo (mais urgentes primeiro)
2. THE Página_Tarefas SHALL permitir filtros por tipo (follow-up, visita, ligação, documentação), status (pendente, concluída, atrasada) e lead
3. THE Página_Tarefas SHALL exibir badge visual para tarefas atrasadas
4. WHEN uma tarefa for concluída, THE Página_Tarefas SHALL registrar a conclusão com data/hora
5. THE Página_Tarefas SHALL permitir criar tarefa manual vinculada a um lead
6. WHERE automações estiverem configuradas, THE Sistema SHALL criar tarefas automaticamente (ex: follow-up 24h após primeiro contato)

#### Campos
- Título (text, obrigatório)
- Descrição (textarea, opcional)
- Tipo (select: follow-up, ligação, visita, documentação, outro)
- Prazo (datetime, obrigatório)
- Lead vinculado (select, opcional)
- Prioridade (select: baixa, média, alta)

#### Permissões
- corretor: suas tarefas
- gerente: tarefas de sua equipe
- diretor: tarefas de todos subordinados

---

### Requisito 43: Templates de Mensagens

**User Story:** Como um gestor, eu quero criar e gerenciar templates de mensagens, para que a equipe possa enviar respostas padronizadas e rápidas pelo Inbox.

#### Critérios de Aceitação

1. THE Página_Templates SHALL exibir lista de templates organizados por categoria (boas-vindas, follow-up, agendamento, proposta, documentação)
2. THE Página_Templates SHALL permitir criar template com variáveis dinâmicas ({{nome_lead}}, {{empreendimento}}, {{corretor}})
3. THE Página_Templates SHALL permitir definir canal de uso (WhatsApp, e-mail, todos)
4. WHEN o corretor selecionar um template no Inbox, THE Sistema SHALL substituir variáveis automaticamente com dados do lead

#### Permissões
- admin_imobiliaria, diretor, gerente: criar e editar templates
- corretor: usar templates existentes

---

### Requisito 44: Filas de Atendimento

**User Story:** Como um gerente, eu quero configurar filas de atendimento, para que leads novos sejam distribuídos automaticamente entre os corretores disponíveis.

#### Critérios de Aceitação

1. THE Página_Filas SHALL exibir filas configuradas com regras de distribuição (round-robin, por performance, por disponibilidade)
2. THE Página_Filas SHALL permitir criar filas por canal (WhatsApp, Instagram) ou por empreendimento
3. THE Página_Filas SHALL exibir métricas por fila: leads na fila, tempo médio de resposta, corretores ativos
4. WHEN um novo lead entrar pela fila, THE Sistema SHALL atribuir automaticamente ao próximo corretor conforme a regra
5. IF todos os corretores estiverem indisponíveis, THEN THE Sistema SHALL enfileirar o lead e notificar o gerente

#### Permissões
- admin_imobiliaria, gerente: configurar filas
- corretor: ver sua posição na fila

---

### Requisito 45: Relatórios Exportáveis

**User Story:** Como um admin ou diretor, eu quero exportar relatórios detalhados, para que eu possa apresentar resultados em reuniões e para stakeholders.

#### Critérios de Aceitação

1. THE Página_Relatorios SHALL oferecer relatórios pré-configurados: vendas mensais, comissões, performance de equipe, conversão de leads, ROI de campanhas
2. THE Página_Relatorios SHALL permitir personalizar período e filtros antes de gerar o relatório
3. THE Página_Relatorios SHALL gerar relatórios em PDF e Excel
4. THE Página_Relatorios SHALL permitir agendar envio automático de relatórios por e-mail (semanal/mensal)

#### Permissões
- admin_imobiliaria: todos os relatórios
- diretor: relatórios de sua equipe
- gerente: relatórios da equipe de corretores

---

### Requisito 46: Auditoria / Logs de Atividade

**User Story:** Como um admin, eu quero visualizar logs de atividade do sistema, para que eu possa rastrear ações dos usuários e garantir conformidade.

#### Critérios de Aceitação

1. THE Página_Auditoria SHALL exibir log cronológico de ações realizadas no sistema (quem, o que, quando, IP)
2. THE Página_Auditoria SHALL permitir filtro por usuário, tipo de ação (criar, editar, deletar, login) e período
3. THE Página_Auditoria SHALL registrar automaticamente: logins, criação/edição/exclusão de leads, propostas, empreendimentos e alterações de permissões
4. THE Página_Auditoria SHALL permitir exportar logs para análise

#### Permissões
- super_admin: logs de toda a plataforma
- admin_imobiliaria: logs de sua imobiliária

---

### Requisito 47: Integrações — Portais Imobiliários

**User Story:** Como um admin, eu quero integrar o sistema com portais imobiliários (ZAP Imóveis, Viva Real, OLX), para que imóveis sejam publicados automaticamente.

#### Critérios de Aceitação

1. THE Página_IntegracaoPortais SHALL exibir lista de portais disponíveis com status de integração (ativo/inativo)
2. THE Página_IntegracaoPortais SHALL permitir configurar credenciais de acesso para cada portal
3. WHEN a integração estiver ativa, THE Sistema SHALL sincronizar imóveis automaticamente com o portal
4. THE Página_IntegracaoPortais SHALL exibir log de sincronização (último sync, erros, imóveis publicados)

#### Permissões
- admin_imobiliaria: acesso exclusivo

---

### Requisito 48: Webhooks e API Pública

**User Story:** Como um admin técnico, eu quero configurar webhooks e acessar documentação de API, para que eu possa integrar o CRM com outros sistemas.

#### Critérios de Aceitação

1. THE Página_Webhooks SHALL exibir lista de webhooks configurados com URL, eventos assinados e status
2. THE Página_Webhooks SHALL permitir criar webhook informando URL, eventos de interesse e secret key
3. THE Página_Webhooks SHALL exibir log de entregas (sucesso/falha) dos últimos 7 dias
4. THE Página_APIDoc SHALL exibir documentação interativa da API (Swagger/OpenAPI)

#### Permissões
- admin_imobiliaria: configurar webhooks e visualizar documentação da API

---

## MAPA DE NAVEGAÇÃO (Conexões entre Páginas)

---

### Requisito 49: Estrutura de Navegação Principal

**User Story:** Como um usuário, eu quero uma navegação clara e organizada por módulos, para que eu possa acessar rapidamente qualquer funcionalidade do sistema.

#### Critérios de Aceitação

1. THE Sidebar SHALL organizar itens em seções: Principal (Dashboard, Pipeline), CRM (Leads, Inbox, Tarefas), Imóveis (Empreendimentos, Imóveis, Propostas), Atendimento (Inbox, Templates, Filas), Marketing (Campanhas, Landing Pages, Materiais), Agenda, Financeiro (Comissões, Contratos), Analytics (Dashboard BI, Relatórios, Forecasting), Administração (Equipe, Permissões, Configurações, Auditoria, Integrações)
2. THE Sidebar SHALL ocultar seções e itens para os quais o usuário não tem permissão
3. THE Sidebar SHALL destacar visualmente o item/seção ativos
4. THE Sidebar SHALL ser colapsável para maximizar área de conteúdo
5. THE Header SHALL exibir: título da página atual, busca global, notificações e menu do usuário
6. WHILE a tela for menor que 768px (mobile), THE Sidebar SHALL se comportar como drawer (overlay)

#### Estrutura de Rotas
- /login
- /register-imobiliaria
- /aguardando-aprovacao
- /dashboard (DashboardHome)
- /dashboard/pipeline (Pipeline Kanban)
- /dashboard/leads (Leads List)
- /dashboard/leads/:id (Lead Detail)
- /dashboard/leads/novo (Lead Form)
- /dashboard/inbox (Inbox Unificado)
- /dashboard/tarefas (Tarefas)
- /dashboard/empreendimentos (Empreendimentos List)
- /dashboard/empreendimentos/novo (Empreendimento Form)
- /dashboard/empreendimentos/:id (Empreendimento Dashboard)
- /dashboard/empreendimentos/:id/editar (Empreendimento Form edit)
- /dashboard/imoveis (Imóveis List)
- /dashboard/imoveis/novo (Imóvel Form)
- /dashboard/propostas (Propostas List)
- /dashboard/propostas/nova (Proposta Form)
- /dashboard/visitas (Visitas List)
- /dashboard/visitas/nova (Visita Form)
- /dashboard/agenda (Agenda/Calendário)
- /dashboard/marketing/campanhas (Campanhas)
- /dashboard/marketing/landing-pages (Landing Pages)
- /dashboard/marketing/materiais (Materiais)
- /dashboard/financeiro/comissoes (Comissões)
- /dashboard/financeiro/contratos (Contratos)
- /dashboard/analytics (Dashboard BI)
- /dashboard/analytics/relatorios (Relatórios)
- /dashboard/analytics/forecasting (Forecasting)
- /dashboard/automacoes (Automações List)
- /dashboard/automacoes/editor/:id (Automação Editor)
- /dashboard/equipe (Equipe)
- /dashboard/users/novo (User Form)
- /dashboard/permissoes (Permissões)
- /dashboard/configuracoes (Configurações)
- /dashboard/configuracoes/canais (Config Canais)
- /dashboard/configuracoes/ia (Config IA)
- /dashboard/configuracoes/integracoes (Integrações/Portais)
- /dashboard/configuracoes/webhooks (Webhooks)
- /dashboard/auditoria (Auditoria)
- /dashboard/perfil (Perfil do Usuário)
- /dashboard/notificacoes (Histórico Notificações)
- /dashboard/templates (Templates Mensagens)
- /dashboard/filas (Filas Atendimento)
- /super/imobiliarias (Super Admin - Imobiliárias)

#### Permissões
- Cada item da sidebar segue as permissões definidas nos requisitos individuais de cada página

---

### Requisito 50: Componentes UI Base (Design System)

**User Story:** Como um desenvolvedor, eu quero ter componentes UI reutilizáveis e padronizados, para que todas as páginas mantenham consistência visual e eu possa desenvolver mais rápido.

#### Critérios de Aceitação

1. THE Design_System SHALL incluir os seguintes componentes: Button (7 variantes), Card, Input, Select, Textarea, Modal, Badge, Table, Spinner, Toast, Dropdown, Tooltip, Pagination, Tabs, Avatar, EmptyState
2. THE Componente_Modal SHALL suportar tamanhos (sm, md, lg) e fechar via ESC, click fora e botão X
3. THE Componente_Table SHALL suportar ordenação por coluna, seleção de linhas e ações em batch
4. THE Componente_Toast SHALL suportar tipos (success, error, warning, info) com auto-dismiss configurável
5. THE Componente_Badge SHALL exibir cores distintas para cada tipo de status e ser acessível (contraste WCAG AA)
6. THE Componente_Pagination SHALL exibir navegação por páginas com contador total de registros
7. THE Design_System SHALL suportar temas dark e light via CSS custom properties

#### Componentes Necessários
- Modal (confirmação, formulário, informação)
- Badge (status, tags, contadores)
- Table (ordenação, seleção, ações)
- Spinner/Loading (inline, fullpage, skeleton)
- Toast/Alert (success, error, warning, info)
- Dropdown/Menu (ações contextuais)
- Tooltip (informações adicionais)
- Pagination (navegação de listas)
- Tabs (organização de conteúdo)
- Avatar (foto do usuário com fallback iniciais)
- EmptyState (estados vazios com ilustração e CTA)

#### Permissões
- N/A (componentes de infraestrutura)

---

## RESUMO DO MAPA DE PÁGINAS

| # | Página | Status | Módulo | Prioridade |
|---|--------|--------|--------|------------|
| 1 | Login | ⚠️ Modernizar | Core | Fase 1 |
| 2 | Register Imobiliária | ✅ Existe | Core | — |
| 3 | Aguardando Aprovação | ✅ Existe | Core | — |
| 4 | Dashboard Home | ⚠️ Modernizar | Core | Fase 1 |
| 5 | Empreendimentos List | ✅ Moderno | Imóveis | — |
| 6 | Empreendimento Dashboard | ✅ Moderno | Imóveis | — |
| 7 | Empreendimento Form | ✅ Moderno | Imóveis | — |
| 8 | Propostas List | ✅ Moderno | Imóveis | — |
| 9 | Proposta Form | ✅ Moderno | Imóveis | — |
| 10 | Visitas List | ✅ Moderno | Imóveis | — |
| 11 | Visita Form | ✅ Moderno | Imóveis | — |
| 12 | Marketing List | ✅ Moderno | Marketing | — |
| 13 | Marketing Form | ✅ Moderno | Marketing | — |
| 14 | Dispensar Material | ✅ Moderno | Marketing | — |
| 15 | Equipe | ✅ Moderno | Admin | — |
| 16 | Permissões | ✅ Moderno | Admin | — |
| 17 | Leads List | ⚠️ Modernizar | CRM | Fase 1 |
| 18 | Lead Detail | ⚠️ Modernizar | CRM | Fase 1 |
| 19 | Lead Form | ⚠️ Modernizar | CRM | Fase 1 |
| 20 | Imóveis List | ⚠️ Modernizar | Imóveis | Fase 1 |
| 21 | Imóvel Form | ⚠️ Modernizar | Imóveis | Fase 1 |
| 22 | Users List | ⚠️ Modernizar | Admin | Fase 1 |
| 23 | User Form | ⚠️ Modernizar | Admin | Fase 1 |
| 24 | Super Admin Imobiliárias | ⚠️ Modernizar | Admin | Fase 1 |
| 25 | Pipeline CRM (Kanban) | ❌ Criar | CRM | Fase 2 |
| 26 | Inbox Unificado | ❌ Criar | Atendimento | Fase 3 |
| 27 | Config Canais | ❌ Criar | Atendimento | Fase 3 |
| 28 | Config IA | ❌ Criar | IA | Fase 4 |
| 29 | Automações List | ❌ Criar | Automações | Fase 5 |
| 30 | Automações Editor | ❌ Criar | Automações | Fase 5 |
| 31 | Agenda/Calendário | ❌ Criar | Agenda | Fase 6 |
| 32 | Campanhas Marketing | ❌ Criar | Marketing | Fase 6 |
| 33 | Landing Pages | ❌ Criar | Marketing | Fase 6 |
| 34 | Comissões | ❌ Criar | Financeiro | Fase 7 |
| 35 | Contratos | ❌ Criar | Financeiro | Fase 7 |
| 36 | Analytics/BI | ❌ Criar | Analytics | Fase 7 |
| 37 | Forecasting | ❌ Criar | Analytics | Fase 7 |
| 38 | Configurações | ❌ Criar | Admin | Fase 2 |
| 39 | Notificações | ❌ Criar | Core | Fase 2 |
| 40 | Perfil do Usuário | ❌ Criar | Core | Fase 1 |
| 41 | Busca Global | ❌ Criar | Core | Fase 2 |
| 42 | Tarefas/Follow-ups | ❌ Criar | CRM | Fase 2 |
| 43 | Templates Mensagens | ❌ Criar | Atendimento | Fase 3 |
| 44 | Filas Atendimento | ❌ Criar | Atendimento | Fase 3 |
| 45 | Relatórios | ❌ Criar | Analytics | Fase 7 |
| 46 | Auditoria/Logs | ❌ Criar | Admin | Fase 7 |
| 47 | Integração Portais | ❌ Criar | Integrações | Fase 8 |
| 48 | Webhooks/API | ❌ Criar | Integrações | Fase 8 |
| 49 | Navegação (Sidebar) | ⚠️ Expandir | Core | Fase 1 |
| 50 | Design System | ⚠️ Completar | Core | Fase 1 |
