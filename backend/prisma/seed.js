const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { defaultAccess } = require('../src/constants/access')

const prisma = new PrismaClient()
const password = value => bcrypt.hash(value, 12)

async function upsertDemoUser(data) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: { name: data.name, role: data.role, imobiliariaId: data.imobiliariaId },
    create: { ...data, password: await password(data.password) }
  })
}

async function setAccess(user, customize = rule => rule) {
  const rules = defaultAccess(user.role).map(customize)
  await prisma.userAccess.deleteMany({ where: { userId: user.id } })
  await prisma.userAccess.createMany({ data: rules.map(rule => ({ userId: user.id, ...rule })) })
}

async function main() {
  console.log('🌱 Criando ambiente demonstrativo...')

  await prisma.user.upsert({
    where: { email: 'super@gestorpro.local' },
    update: {},
    create: { name: 'Super Admin', email: 'super@gestorpro.local', password: await password('Super@123'), role: 'super_admin' }
  })

  let imobiliaria = await prisma.imobiliaria.findFirst({ where: { email: 'contato@prime.local' } })
  if (!imobiliaria) {
    imobiliaria = await prisma.imobiliaria.create({
      data: { nome: 'Imobiliária Prime Demo', cnpj: '12345678000190', email: 'contato@prime.local', telefone: '11999999999', status: 'ativa', plan: 'enterprise' }
    })
  }

  const admin = await upsertDemoUser({ name: 'Ana Administradora', email: 'admin@prime.local', password: 'Admin@123', role: 'admin_imobiliaria', imobiliariaId: imobiliaria.id })
  const diretor = await upsertDemoUser({ name: 'Diego Diretor', email: 'diretor@prime.local', password: 'Diretor@123', role: 'diretor', imobiliariaId: imobiliaria.id })
  const gerente = await upsertDemoUser({ name: 'Gabriela Gerente', email: 'gerente@prime.local', password: 'Gerente@123', role: 'gerente', imobiliariaId: imobiliaria.id })
  const corretor = await upsertDemoUser({ name: 'Carlos Corretor', email: 'corretor@prime.local', password: 'Corretor@123', role: 'corretor', imobiliariaId: imobiliaria.id })
  const leitor = await upsertDemoUser({ name: 'Laura Somente Leitura', email: 'leitor@prime.local', password: 'Leitor@123', role: 'corretor', imobiliariaId: imobiliaria.id })

  await prisma.user.update({ where: { id: gerente.id }, data: { diretorId: diretor.id } })
  await prisma.user.update({ where: { id: corretor.id }, data: { gerenteId: gerente.id } })
  await prisma.user.update({ where: { id: leitor.id }, data: { gerenteId: gerente.id } })

  await setAccess(admin)
  await setAccess(diretor)
  await setAccess(gerente)
  await setAccess(corretor)
  await setAccess(leitor, rule => ({
    ...rule,
    canView: ['dashboard', 'leads', 'empreendimentos', 'imoveis', 'propostas', 'agenda'].includes(rule.page),
    canEdit: false
  }))

  await prisma.configImobiliaria.upsert({
    where: { imobiliariaId: imobiliaria.id },
    update: {},
    create: {
      imobiliariaId: imobiliaria.id, tema: 'dark', corPrimaria: '#d4af37',
      corSecundaria: '#1f2937', horarioInicio: '08:00', horarioFim: '18:00',
      comissaoCorretor: 3, comissaoGerente: 1, comissaoDiretor: 0.5
    }
  })

  const recursos = ['empreendimentos', 'propostas', 'leads', 'visitas', 'marketing']
  const acoes = ['criar', 'ler', 'atualizar', 'deletar']
  for (const role of ['diretor', 'gerente', 'corretor']) {
    for (const recurso of recursos) {
      for (const acao of acoes) {
        const permitido = role === 'diretor' || acao === 'ler' || (role === 'gerente' && acao !== 'deletar')
        const existing = await prisma.permissao.findFirst({ where: { role, recurso, acao, imobiliariaId: imobiliaria.id } })
        if (existing) await prisma.permissao.update({ where: { id: existing.id }, data: { permitido } })
        else await prisma.permissao.create({ data: { role, recurso, acao, permitido, imobiliariaId: imobiliaria.id } })
      }
    }
  }

  const stageNames = ['Novo Lead', 'Contato realizado', 'Visita agendada', 'Proposta', 'Fechado']
  for (const [ordem, nome] of stageNames.entries()) {
    await prisma.pipelineStage.upsert({
      where: { imobiliariaId_ordem: { imobiliariaId: imobiliaria.id, ordem } },
      update: { nome }, create: { nome, ordem, imobiliariaId: imobiliaria.id }
    })
  }

  let empreendimento = await prisma.empreendimento.findFirst({ where: { nome: 'Residencial Horizonte', imobiliariaId: imobiliaria.id } })
  if (!empreendimento) {
    empreendimento = await prisma.empreendimento.create({
      data: { nome: 'Residencial Horizonte', tipoUnidade: 'apartamento', quantidadeUnidades: 3, bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Exemplo, 1000', descricao: 'Empreendimento demonstrativo', imobiliariaId: imobiliaria.id }
    })
    await prisma.unidade.createMany({ data: [
      { empreendimentoId: empreendimento.id, numero: '101', bloco: 'A', valorBase: 450000, valorTotal: 450000, status: 'disponivel' },
      { empreendimentoId: empreendimento.id, numero: '102', bloco: 'A', valorBase: 470000, valorTotal: 470000, status: 'reservada' },
      { empreendimentoId: empreendimento.id, numero: '201', bloco: 'A', valorBase: 520000, valorTotal: 520000, status: 'disponivel' }
    ] })
  }

  await prisma.empreendimentoEquipe.upsert({
    where: { empreendimentoId_imobiliariaId: { empreendimentoId: empreendimento.id, imobiliariaId: imobiliaria.id } },
    update: { ativa: true, comissaoPercent: 5 },
    create: { empreendimentoId: empreendimento.id, imobiliariaId: imobiliaria.id, ativa: true, comissaoPercent: 5 }
  })

  if (!await prisma.galeriaImagem.findFirst({ where: { empreendimentoId: empreendimento.id, titulo: 'Fachada principal demo' } })) {
    await prisma.galeriaImagem.createMany({ data: [
      { empreendimentoId: empreendimento.id, url: 'https://placehold.co/1200x800?text=Fachada', categoria: 'fachada', titulo: 'Fachada principal demo', isCapa: true, ordem: 0 },
      { empreendimentoId: empreendimento.id, url: 'https://placehold.co/1200x800?text=Area+Comum', categoria: 'areas_comuns', titulo: 'Área de lazer demo', ordem: 1 }
    ] })
  }

  const unidades = await prisma.unidade.findMany({ where: { empreendimentoId: empreendimento.id }, orderBy: { numero: 'asc' } })
  let tabela = await prisma.tabelaPreco.findFirst({ where: { empreendimentoId: empreendimento.id, nome: 'Tabela Demo 2026' } })
  if (!tabela) {
    tabela = await prisma.tabelaPreco.create({ data: { empreendimentoId: empreendimento.id, nome: 'Tabela Demo 2026', grupo: 'padrao', modelo: 'modelo_1', ativa: true, incluirDesconto: true, incluirJuros: true } })
    await prisma.tabelaPrecoItem.createMany({ data: [
      { tabelaId: tabela.id, unidadeId: unidades[0]?.id, descricao: 'Entrada', valor: 90000, parcelas: 1, valorParcela: 90000, desconto: 2, ordem: 1 },
      { tabelaId: tabela.id, unidadeId: unidades[0]?.id, descricao: 'Parcelas mensais', valor: 360000, parcelas: 36, valorParcela: 10000, juros: 0.6, ordem: 2 }
    ] })
  }

  if (!await prisma.imovel.findFirst({ where: { titulo: 'Casa Jardim Demo', imobiliariaId: imobiliaria.id } })) {
    await prisma.imovel.create({ data: { titulo: 'Casa Jardim Demo', descricao: 'Imóvel para testes do catálogo', valor: 780000, endereco: 'Rua das Flores, 50', cidade: 'São Paulo', estado: 'SP', status: 'disponivel', imobiliariaId: imobiliaria.id } })
  }

  let lead = await prisma.lead.findFirst({ where: { telefone: '11988887777', imobiliariaId: imobiliaria.id } })
  if (!lead) {
    lead = await prisma.lead.create({ data: { nome: 'Mariana Cliente Demo', email: 'mariana@example.local', telefone: '11988887777', status: 'novo', origem: 'site', temperatura: 'quente', corretorId: corretor.id, imobiliariaId: imobiliaria.id } })
    const firstStage = await prisma.pipelineStage.findFirst({ where: { imobiliariaId: imobiliaria.id }, orderBy: { ordem: 'asc' } })
    await prisma.leadPipeline.create({ data: { leadId: lead.id, stageId: firstStage.id, temperatura: 'quente', valorPotencial: 520000 } })
    await prisma.atendimento.create({ data: { leadId: lead.id, corretorId: corretor.id, mensagem: 'Cliente demonstrou interesse no Residencial Horizonte.' } })
  }

  let secondLead = await prisma.lead.findFirst({ where: { telefone: '11977776666', imobiliariaId: imobiliaria.id } })
  if (!secondLead) {
    secondLead = await prisma.lead.create({ data: { nome: 'Roberto Cliente Demo', email: 'roberto@example.local', telefone: '11977776666', status: 'em_atendimento', origem: 'instagram', temperatura: 'morno', corretorId: leitor.id, imobiliariaId: imobiliaria.id } })
    const contactStage = await prisma.pipelineStage.findFirst({ where: { imobiliariaId: imobiliaria.id, ordem: 1 } })
    await prisma.leadPipeline.create({ data: { leadId: secondLead.id, stageId: contactStage.id, temperatura: 'morno', valorPotencial: 470000 } })
  }

  if (!await prisma.task.findFirst({ where: { titulo: 'Retornar contato da Mariana', imobiliariaId: imobiliaria.id } })) {
    await prisma.task.create({ data: { titulo: 'Retornar contato da Mariana', descricao: 'Apresentar unidades disponíveis', tipo: 'follow_up', prioridade: 'alta', prazo: new Date(Date.now() + 86400000), userId: corretor.id, leadId: lead.id, imobiliariaId: imobiliaria.id } })
  }

  if (!await prisma.task.findFirst({ where: { titulo: 'Separar documentação da proposta', imobiliariaId: imobiliaria.id } })) {
    await prisma.task.createMany({ data: [
      { titulo: 'Separar documentação da proposta', descricao: 'RG, CPF e comprovantes', tipo: 'documentacao', prioridade: 'media', prazo: new Date(Date.now() + 172800000), userId: gerente.id, leadId: lead.id, imobiliariaId: imobiliaria.id },
      { titulo: 'Confirmar visita concluída', tipo: 'visita', prioridade: 'baixa', status: 'concluida', prazo: new Date(Date.now() - 86400000), concluidaEm: new Date(), userId: corretor.id, leadId: lead.id, imobiliariaId: imobiliaria.id },
      { titulo: 'Follow-up atrasado demo', tipo: 'ligacao', prioridade: 'alta', status: 'atrasada', prazo: new Date(Date.now() - 172800000), userId: corretor.id, leadId: secondLead.id, imobiliariaId: imobiliaria.id }
    ] })
  }

  let proposta = await prisma.proposta.findFirst({ where: { clienteCpf: '12345678901', imobiliariaId: imobiliaria.id } })
  if (!proposta && unidades[0]) {
    proposta = await prisma.proposta.create({ data: {
      empreendimentoId: empreendimento.id, unidadeId: unidades[0].id, corretorId: corretor.id, imobiliariaId: imobiliaria.id,
      clienteNome: 'Mariana', clienteSobrenome: 'Silva', clienteRg: '123456789', clienteCpf: '12345678901',
      clienteProfissao: 'Arquiteta', clienteRemuneracao: 15000, valorAVista: 90000, valorMensais: 10000,
      saldoFinanciar: 360000, status: 'aprovada', observacoes: 'Proposta aprovada para demonstração.'
    } })
  }

  if (!await prisma.visita.findFirst({ where: { telefoneVisitante: '11988887777', empreendimentoId: empreendimento.id } })) {
    await prisma.visita.create({ data: { nomeVisitante: 'Mariana Silva', telefoneVisitante: '11988887777', emailVisitante: 'mariana@example.local', tipo: 'agendada', dataVisita: new Date(Date.now() + 259200000), empreendimentoId: empreendimento.id, unidadeId: unidades[0]?.id, imobiliariaId: imobiliaria.id, atendenteId: corretor.id, observacoes: 'Visita demonstrativa à unidade decorada.' } })
  }

  let material = await prisma.materialMarketing.findFirst({ where: { empreendimentoId: empreendimento.id, tipo: 'folder' } })
  if (!material) {
    material = await prisma.materialMarketing.create({ data: { tipo: 'folder', empreendimentoId: empreendimento.id, quantidadeInicial: 100, quantidadeEstoque: 90, descricao: 'Folder institucional demonstrativo' } })
    await prisma.dispensacaoMaterial.create({ data: { materialId: material.id, quantidade: 10, dispensadoPara: 'Equipe de corretores', dispensadoPor: gerente.id, observacoes: 'Material para evento de lançamento.' } })
  }

  if (!await prisma.messageTemplate.findFirst({ where: { nome: 'Boas-vindas Demo', imobiliariaId: imobiliaria.id } })) {
    await prisma.messageTemplate.createMany({ data: [
      { nome: 'Boas-vindas Demo', categoria: 'boas_vindas', conteudo: 'Olá {{nome_lead}}, recebemos seu contato!', canal: 'whatsapp', imobiliariaId: imobiliaria.id },
      { nome: 'Confirmação de visita Demo', categoria: 'agendamento', conteudo: 'Sua visita ao {{empreendimento}} está confirmada.', canal: 'todos', imobiliariaId: imobiliaria.id }
    ] })
  }

  let conversation = await prisma.conversation.findFirst({ where: { externalId: 'demo-conversation-001', imobiliariaId: imobiliaria.id } })
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { canal: 'whatsapp', status: 'aberta', externalId: 'demo-conversation-001', contactName: 'Mariana Silva', contactPhone: '11988887777', leadId: lead.id, assignedToId: corretor.id, imobiliariaId: imobiliaria.id } })
    await prisma.message.createMany({ data: [
      { conversationId: conversation.id, direction: 'inbound', content: 'Olá, gostaria de saber mais sobre o Residencial Horizonte.', status: 'read', senderName: 'Mariana Silva' },
      { conversationId: conversation.id, direction: 'outbound', content: 'Olá Mariana! Vou enviar as opções disponíveis.', status: 'delivered', senderName: 'Carlos Corretor' }
    ] })
  }

  if (!await prisma.notification.findFirst({ where: { userId: corretor.id, titulo: 'Novo lead atribuído' } })) {
    await prisma.notification.createMany({ data: [
      { userId: corretor.id, tipo: 'lead_atribuido', titulo: 'Novo lead atribuído', mensagem: 'Mariana Silva foi atribuída a você.', link: `/dashboard/leads/${lead.id}`, imobiliariaId: imobiliaria.id },
      { userId: gerente.id, tipo: 'nova_proposta', titulo: 'Nova proposta aprovada', mensagem: 'A proposta demonstrativa foi aprovada.', link: '/dashboard/propostas', imobiliariaId: imobiliaria.id }
    ] })
  }

  if (proposta && !await prisma.comissao.findFirst({ where: { propostaId: proposta.id, userId: corretor.id } })) {
    await prisma.comissao.createMany({ data: [
      { propostaId: proposta.id, userId: corretor.id, role: 'corretor', percentual: 3, valorVenda: 450000, valorComissao: 13500, status: 'pendente', imobiliariaId: imobiliaria.id },
      { propostaId: proposta.id, userId: gerente.id, role: 'gerente', percentual: 1, valorVenda: 450000, valorComissao: 4500, status: 'pendente', imobiliariaId: imobiliaria.id },
      { propostaId: proposta.id, userId: diretor.id, role: 'diretor', percentual: 0.5, valorVenda: 450000, valorComissao: 2250, status: 'paga', dataPagamento: new Date(), imobiliariaId: imobiliaria.id }
    ] })
  }

  let automation = await prisma.automation.findFirst({ where: { nome: 'Nutrição de novo lead Demo', imobiliariaId: imobiliaria.id } })
  if (!automation) {
    automation = await prisma.automation.create({ data: { nome: 'Nutrição de novo lead Demo', descricao: 'Envia boas-vindas e cria follow-up', status: 'ativo', gatilho: 'novo_lead', nodes: [{ id: 'trigger', type: 'trigger' }, { id: 'message', type: 'message' }], edges: [{ source: 'trigger', target: 'message' }], imobiliariaId: imobiliaria.id, lastRunAt: new Date() } })
    await prisma.automationExec.create({ data: { automationId: automation.id, leadId: lead.id, status: 'success', logs: { message: 'Execução demonstrativa concluída' }, completedAt: new Date() } })
  }

  if (!await prisma.auditLog.findFirst({ where: { userId: admin.id, recurso: 'seed_demo', imobiliariaId: imobiliaria.id } })) {
    await prisma.auditLog.createMany({ data: [
      { userId: admin.id, acao: 'criar', recurso: 'seed_demo', detalhes: { origem: 'prisma-seed' }, ip: '127.0.0.1', imobiliariaId: imobiliaria.id },
      { userId: gerente.id, acao: 'aprovar', recurso: 'proposta', recursoId: proposta?.id, detalhes: { status: 'aprovada' }, ip: '127.0.0.1', imobiliariaId: imobiliaria.id }
    ] })
  }

  let webhook = await prisma.webhook.findFirst({ where: { url: 'https://example.local/webhooks/gestorpro-demo', imobiliariaId: imobiliaria.id } })
  if (!webhook) {
    webhook = await prisma.webhook.create({ data: { url: 'https://example.local/webhooks/gestorpro-demo', eventos: ['lead.criado', 'proposta.aprovada'], secretKey: 'demo-secret-change-me', ativo: false, imobiliariaId: imobiliaria.id } })
    await prisma.webhookDelivery.create({ data: { webhookId: webhook.id, evento: 'lead.criado', payload: { leadId: lead.id, demo: true }, statusCode: 200, response: '{"received":true}', sucesso: true } })
  }

  const counts = await Promise.all([
    prisma.user.count({ where: { imobiliariaId: imobiliaria.id } }),
    prisma.lead.count({ where: { imobiliariaId: imobiliaria.id } }),
    prisma.task.count({ where: { imobiliariaId: imobiliaria.id } }),
    prisma.empreendimento.count({ where: { imobiliariaId: imobiliaria.id } }),
    prisma.proposta.count({ where: { imobiliariaId: imobiliaria.id } }),
    prisma.conversation.count({ where: { imobiliariaId: imobiliaria.id } })
  ])
  console.log(`✅ Seed concluído: ${counts[0]} usuários, ${counts[1]} leads, ${counts[2]} tarefas, ${counts[3]} empreendimentos, ${counts[4]} propostas e ${counts[5]} conversas.`)
  console.log('🔐 Logins demonstrativos estão documentados no README.')
}

main().catch(error => { console.error('❌ Seed failed:', error); process.exit(1) }).finally(() => prisma.$disconnect())
