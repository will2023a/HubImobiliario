const express = require('express');
const prisma = require('../prisma/client');
const { requirePermission } = require('../middlewares/permissions');
const { getAccessibleEmpreendimento } = require('../utils/empreendimento-access');
const { logAudit } = require('../services/audit.service');
const { resolverTabela, analisar, round2 } = require('../utils/analise-proposta');
const { validateCpf } = require('../utils/validators');

const router = express.Router();

const GESTOR_ROLES = ['gerente', 'diretor', 'admin_imobiliaria', 'super_admin'];
const TIPOS_SERIE = ['ato', 'pontual', 'mensal', 'semestral', 'anual', 'unica', 'financiamento'];

function normSerie(s, idx) {
  const valor = parseFloat(s.valor) || 0;
  const quantidade = Math.max(1, parseInt(s.quantidade, 10) || 1);
  return {
    nome: String(s.nome || '').trim() || 'Série',
    tipo: TIPOS_SERIE.includes(s.tipo) ? s.tipo : 'pontual',
    inicioMes: Math.min(12, Math.max(1, parseInt(s.inicioMes, 10) || 1)),
    inicioAno: parseInt(s.inicioAno, 10) || new Date().getFullYear(),
    quantidade,
    valor,
    periodicidade: Math.max(1, parseInt(s.periodicidade, 10) || 1),
    aposHabitese: Boolean(s.aposHabitese),
    vencimentoDia: s.vencimentoDia ? parseInt(s.vencimentoDia, 10) : null,
    total: round2(valor * quantidade),
    ordem: s.ordem != null ? parseInt(s.ordem, 10) : idx,
  };
}

// Escopo por hierarquia (mesma lógica de routes/propostas.js).
function canAccess(user, proposta) {
  if (user.role === 'super_admin') return true;
  if (proposta.imobiliariaId && proposta.imobiliariaId === user.imobiliariaId) return true;
  return proposta.corretorId === user.id;
}

async function tabelaPadrao(empreendimentoId, tipologia) {
  return prisma.tabelaPreco.findFirst({
    where: { empreendimentoId, ativa: true, OR: [{ tipologia: null }, { tipologia: tipologia || undefined }] },
    include: { series: { orderBy: { ordem: 'asc' } } },
    orderBy: [{ tipologia: 'desc' }, { createdAt: 'desc' }],
  });
}

// Monta o payload completo de análise a partir de dados já carregados.
function montarPayload({ proposta, tabela, unidade, empreendimento, parametros }) {
  const tabelaResolvida = resolverTabela(tabela, unidade, empreendimento);
  const propostaSeries = (proposta?.series?.length ? proposta.series : tabelaResolvida.series);
  const analise = analisar({ tabelaResolvida, propostaSeries, parametros: parametros || {}, unidade, empreendimento });
  return {
    proposta: proposta ? {
      id: proposta.id, status: proposta.status, tipoAnalise: proposta.tipoAnalise,
      requerAprovacao: proposta.requerAprovacao, clienteNome: proposta.clienteNome,
      aprovadoEm: proposta.aprovadoEm, motivoReprovacao: proposta.motivoReprovacao,
    } : null,
    unidade: {
      id: unidade.id, numero: unidade.numero, identificacao: unidade.identificacao,
      tipo: unidade.tipo, area: unidade.area, vagas: unidade.vagas, bloco: unidade.bloco,
      andar: unidade.andar, valorTotal: unidade.valorTotal, status: unidade.status,
    },
    empreendimento: { id: empreendimento.id, nome: empreendimento.nome, dataPrevisaoConstrucao: empreendimento.dataPrevisaoConstrucao },
    tabela: { id: tabela.id, nome: tabela.nome, validadeInicio: tabela.validadeInicio, validadeFim: tabela.validadeFim },
    tabelaSeries: tabelaResolvida.series,
    tabelaTotal: tabelaResolvida.total,
    propostaSeries,
    parametros: parametros || null,
    analise,
  };
}

// POST /propostas/simular  { unidadeId, tabelaId? }
router.post('/simular', requirePermission('propostas', 'criar'), async (req, res) => {
  try {
    const unidadeId = Number(req.body.unidadeId);
    const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId }, include: { empreendimento: { include: { parametrosAnalise: true } } } });
    if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada' });
    const empreendimento = await getAccessibleEmpreendimento(req.user, unidade.empreendimentoId);
    if (!empreendimento) return res.status(404).json({ error: 'Empreendimento não encontrado' });
    if (unidade.status !== 'disponivel') return res.status(409).json({ error: 'Só é possível simular venda de unidade disponível' });

    const tabela = req.body.tabelaId
      ? await prisma.tabelaPreco.findFirst({ where: { id: Number(req.body.tabelaId), empreendimentoId: unidade.empreendimentoId }, include: { series: { orderBy: { ordem: 'asc' } } } })
      : await tabelaPadrao(unidade.empreendimentoId, unidade.tipo);
    if (!tabela || !tabela.series.length) return res.status(422).json({ error: 'Nenhuma tabela de venda com séries para este empreendimento' });

    // Reaproveita uma simulação em rascunho já iniciada por este corretor para esta unidade.
    const existente = await prisma.proposta.findFirst({
      where: { unidadeId: unidade.id, corretorId: req.user.id, tipoAnalise: 'simulacao', status: { in: ['rascunho', 'simulacao'] } },
      include: { series: { orderBy: { ordem: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    if (existente) {
      return res.json(montarPayload({ proposta: existente, tabela, unidade, empreendimento: unidade.empreendimento, parametros: unidade.empreendimento.parametrosAnalise }));
    }

    const resolvida = resolverTabela(tabela, unidade, unidade.empreendimento);

    const proposta = await prisma.proposta.create({
      data: {
        empreendimentoId: unidade.empreendimentoId,
        unidadeId: unidade.id,
        tabelaId: tabela.id,
        corretorId: req.user.id,
        imobiliariaId: req.user.imobiliariaId || empreendimento.imobiliariaId,
        clienteNome: req.body.clienteNome?.trim() || 'Cliente simulação',
        tipoAnalise: 'simulacao',
        status: 'rascunho',
        valorTabela: resolvida.total,
        valorProposta: resolvida.total,
        diferenca: 0,
        series: {
          create: resolvida.series.map((s, i) => normSerie({
            nome: s.nome, tipo: s.tipo, inicioMes: s.inicioMes, inicioAno: s.inicioAno,
            quantidade: s.quantidade, valor: s.valor, periodicidade: s.periodicidade, aposHabitese: s.aposHabitese, ordem: i,
          }, i)),
        },
      },
      include: { series: { orderBy: { ordem: 'asc' } } },
    });

    const payload = montarPayload({
      proposta, tabela, unidade, empreendimento: unidade.empreendimento, parametros: unidade.empreendimento.parametrosAnalise,
    });
    res.status(201).json(payload);
  } catch (err) {
    console.error('Erro simular:', err);
    res.status(500).json({ error: 'Erro ao iniciar simulação', details: err.message });
  }
});

// POST /propostas/analise/preview  { tabelaId, unidadeId, series }  — stateless
router.post('/analise/preview', requirePermission('propostas', 'ler'), async (req, res) => {
  try {
    const unidade = await prisma.unidade.findUnique({ where: { id: Number(req.body.unidadeId) }, include: { empreendimento: { include: { parametrosAnalise: true } } } });
    if (!unidade || !await getAccessibleEmpreendimento(req.user, unidade.empreendimentoId)) return res.status(404).json({ error: 'Unidade não encontrada' });
    const tabela = await prisma.tabelaPreco.findFirst({ where: { id: Number(req.body.tabelaId), empreendimentoId: unidade.empreendimentoId }, include: { series: { orderBy: { ordem: 'asc' } } } });
    if (!tabela) return res.status(404).json({ error: 'Tabela não encontrada' });

    const tabelaResolvida = resolverTabela(tabela, unidade, unidade.empreendimento);
    const propostaSeries = (req.body.series || []).map(normSerie);
    const analise = analisar({
      tabelaResolvida,
      propostaSeries: propostaSeries.length ? propostaSeries : tabelaResolvida.series,
      parametros: unidade.empreendimento.parametrosAnalise || {},
      unidade,
      empreendimento: unidade.empreendimento,
    });
    res.json({ tabelaSeries: tabelaResolvida.series, tabelaTotal: tabelaResolvida.total, analise });
  } catch (err) {
    console.error('Erro preview:', err);
    res.status(500).json({ error: 'Erro ao calcular análise' });
  }
});

async function loadProposta(id) {
  return prisma.proposta.findUnique({
    where: { id: Number(id) },
    include: {
      series: { orderBy: { ordem: 'asc' } },
      unidade: true,
      empreendimento: { include: { parametrosAnalise: true } },
      tabela: { include: { series: { orderBy: { ordem: 'asc' } } } },
    },
  });
}

// GET /propostas/:id/analise
router.get('/:id/analise', requirePermission('propostas', 'ler'), async (req, res) => {
  const proposta = await loadProposta(req.params.id);
  if (!proposta || !proposta.tabela) return res.status(404).json({ error: 'Proposta/tabela não encontrada' });
  if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
  res.json(montarPayload({
    proposta, tabela: proposta.tabela, unidade: proposta.unidade,
    empreendimento: proposta.empreendimento, parametros: proposta.empreendimento.parametrosAnalise,
  }));
});

// PUT /propostas/:id/series  — salva a proposta do cliente e recalcula
router.put('/:id/series', requirePermission('propostas', 'atualizar'), async (req, res) => {
  try {
    const proposta = await loadProposta(req.params.id);
    if (!proposta || !proposta.tabela) return res.status(404).json({ error: 'Proposta não encontrada' });
    if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
    if (['aprovada', 'cancelada'].includes(proposta.status)) return res.status(409).json({ error: 'Proposta não editável' });

    const series = (req.body.series || []).map(normSerie);
    const tabelaResolvida = resolverTabela(proposta.tabela, proposta.unidade, proposta.empreendimento);
    const analise = analisar({ tabelaResolvida, propostaSeries: series, parametros: proposta.empreendimento.parametrosAnalise || {}, unidade: proposta.unidade, empreendimento: proposta.empreendimento });

    await prisma.$transaction([
      prisma.propostaSerie.deleteMany({ where: { propostaId: proposta.id } }),
      prisma.propostaSerie.createMany({ data: series.map((s) => ({ ...s, propostaId: proposta.id })) }),
      prisma.proposta.update({
        where: { id: proposta.id },
        data: {
          valorTabela: tabelaResolvida.total,
          valorProposta: analise.totais.proposta,
          diferenca: analise.totais.diferenca,
          resultadoAnalise: analise.criterios,
          indicadores: analise.indicadores,
        },
      }),
    ]);

    const atualizada = await loadProposta(req.params.id);
    res.json(montarPayload({
      proposta: atualizada, tabela: atualizada.tabela, unidade: atualizada.unidade,
      empreendimento: atualizada.empreendimento, parametros: atualizada.empreendimento.parametrosAnalise,
    }));
  } catch (err) {
    console.error('Erro salvar séries proposta:', err);
    res.status(500).json({ error: 'Erro ao salvar proposta' });
  }
});

async function mudarStatusUnidade(tx, unidade, statusNovo, userId, motivo) {
  if (unidade.status === statusNovo) return;
  await tx.unidade.update({ where: { id: unidade.id }, data: { status: statusNovo } });
  await tx.unidadeStatusHistorico.create({ data: { unidadeId: unidade.id, statusAnterior: unidade.status, statusNovo, changedById: userId, motivo } });
}

// POST /propostas/:id/enviar  — converte simulação em proposta e valida limites
router.post('/:id/enviar', requirePermission('propostas', 'atualizar'), async (req, res) => {
  try {
    const proposta = await loadProposta(req.params.id);
    if (!proposta || !proposta.tabela) return res.status(404).json({ error: 'Proposta não encontrada' });
    if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
    if (!['rascunho', 'simulacao', 'reprovada'].includes(proposta.status)) return res.status(409).json({ error: `Proposta já está "${proposta.status}"` });
    if (proposta.unidade.status !== 'disponivel') return res.status(409).json({ error: 'Unidade não está mais disponível' });

    const tabelaResolvida = resolverTabela(proposta.tabela, proposta.unidade, proposta.empreendimento);
    const analise = analisar({ tabelaResolvida, propostaSeries: proposta.series, parametros: proposta.empreendimento.parametrosAnalise || {}, unidade: proposta.unidade, empreendimento: proposta.empreendimento });
    if (Math.abs(analise.totais.diferenca) > 0.5) return res.status(422).json({ error: 'A diferença entre proposta e tabela precisa ser zero', diferenca: analise.totais.diferenca });
    if (!analise.formasOk) return res.status(422).json({ error: `Formas de pagamento não aceitas neste empreendimento: ${analise.tiposForaDaLista.join(', ')}` });

    const dados = req.body.cliente || {};
    const requerAprovacao = !analise.aprovavel;
    const statusUnidade = requerAprovacao ? 'em_aprovacao' : 'em_negociacao';

    await prisma.$transaction(async (tx) => {
      await tx.proposta.update({
        where: { id: proposta.id },
        data: {
          tipoAnalise: 'proposta',
          status: 'em_analise',
          requerAprovacao,
          valorTabela: tabelaResolvida.total,
          valorProposta: analise.totais.proposta,
          diferenca: analise.totais.diferenca,
          resultadoAnalise: analise.criterios,
          indicadores: analise.indicadores,
          motivoReprovacao: null,
          ...(dados.nome && { clienteNome: String(dados.nome).trim() }),
          ...(dados.sobrenome && { clienteSobrenome: String(dados.sobrenome).trim() }),
          ...(dados.rg && { clienteRg: String(dados.rg).trim() }),
          ...(dados.cpf && { clienteCpf: String(dados.cpf).trim() }),
          ...(dados.profissao && { clienteProfissao: String(dados.profissao).trim() }),
          ...(dados.remuneracao != null && { clienteRemuneracao: parseFloat(dados.remuneracao) || 0 }),
          ...(req.body.observacoes != null && { observacoes: String(req.body.observacoes) }),
        },
      });
      await mudarStatusUnidade(tx, proposta.unidade, statusUnidade, req.user.id, `Proposta #${proposta.id} enviada`);
    });

    await logAudit({ userId: req.user.id, acao: 'criar', recurso: 'proposta', recursoId: proposta.id, imobiliariaId: proposta.imobiliariaId, detalhes: { aprovavel: analise.aprovavel, requerAprovacao } });
    res.json({ ok: true, requerAprovacao, statusUnidade });
  } catch (err) {
    console.error('Erro enviar proposta:', err);
    res.status(500).json({ error: 'Erro ao enviar proposta' });
  }
});

// POST /propostas/:id/aprovar  (gestor)
router.post('/:id/aprovar', requirePermission('propostas', 'atualizar'), async (req, res) => {
  if (!GESTOR_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Apenas gestores podem aprovar' });
  const proposta = await loadProposta(req.params.id);
  if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
  if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
  if (proposta.status !== 'em_analise') return res.status(409).json({ error: 'Proposta não está em análise' });

  await prisma.$transaction(async (tx) => {
    await tx.proposta.update({ where: { id: proposta.id }, data: { status: 'aprovada', requerAprovacao: false, aprovadoPorId: req.user.id, aprovadoEm: new Date() } });
    await mudarStatusUnidade(tx, proposta.unidade, 'vendido', req.user.id, `Proposta #${proposta.id} aprovada`);
  });
  await logAudit({ userId: req.user.id, acao: 'aprovar', recurso: 'proposta', recursoId: proposta.id, imobiliariaId: proposta.imobiliariaId });
  res.json({ ok: true });
});

// POST /propostas/:id/reprovar  (gestor)
router.post('/:id/reprovar', requirePermission('propostas', 'atualizar'), async (req, res) => {
  if (!GESTOR_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Apenas gestores podem reprovar' });
  const proposta = await loadProposta(req.params.id);
  if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
  if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
  if (proposta.status !== 'em_analise') return res.status(409).json({ error: 'Proposta não está em análise' });

  await prisma.$transaction(async (tx) => {
    await tx.proposta.update({ where: { id: proposta.id }, data: { status: 'reprovada', requerAprovacao: false, motivoReprovacao: req.body.motivo?.trim() || null } });
    await mudarStatusUnidade(tx, proposta.unidade, 'disponivel', req.user.id, `Proposta #${proposta.id} reprovada`);
  });
  await logAudit({ userId: req.user.id, acao: 'rejeitar', recurso: 'proposta', recursoId: proposta.id, imobiliariaId: proposta.imobiliariaId, detalhes: { motivo: req.body.motivo || null } });
  res.json({ ok: true });
});

// POST /propostas/:id/cancelar-negociacao
router.post('/:id/cancelar-negociacao', requirePermission('propostas', 'atualizar'), async (req, res) => {
  const proposta = await loadProposta(req.params.id);
  if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
  if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
  if (['aprovada', 'cancelada'].includes(proposta.status)) return res.status(409).json({ error: 'Proposta não pode ser cancelada' });

  await prisma.$transaction(async (tx) => {
    await tx.proposta.update({ where: { id: proposta.id }, data: { status: 'cancelada', requerAprovacao: false } });
    if (['reservada', 'pre_reservada', 'em_negociacao', 'em_aprovacao'].includes(proposta.unidade.status)) {
      await mudarStatusUnidade(tx, proposta.unidade, 'disponivel', req.user.id, `Negociação da proposta #${proposta.id} cancelada`);
    }
  });
  await logAudit({ userId: req.user.id, acao: 'editar', recurso: 'proposta', recursoId: proposta.id, imobiliariaId: proposta.imobiliariaId, detalhes: { acao: 'cancelar_negociacao', motivo: req.body.motivo || null } });
  res.json({ ok: true });
});

// ===== Cadastro do cliente (etapa pós-aprovação) =====

const CLIENTE_STR = ['nome', 'sobrenome', 'cpf', 'rg', 'orgaoExpedidor', 'nacionalidade', 'estadoCivil', 'profissao', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'conjugeNome', 'conjugeCpf', 'conjugeRg', 'conjugeProfissao', 'observacoes'];
const CLIENTE_FLOAT = ['rendaMensal', 'conjugeRendaMensal'];

function montarDadosCliente(body) {
  const data = {};
  for (const f of CLIENTE_STR) if (body[f] !== undefined) data[f] = body[f] === '' ? null : String(body[f]).trim();
  for (const f of CLIENTE_FLOAT) if (body[f] !== undefined) data[f] = body[f] === '' || body[f] === null ? null : parseFloat(body[f]);
  if (body.dataNascimento !== undefined) data.dataNascimento = body.dataNascimento ? new Date(body.dataNascimento) : null;
  if (body.leadId !== undefined) data.leadId = body.leadId ? Number(body.leadId) : null;
  return data;
}

// GET /propostas/:id/cliente  -> cliente atual + leads da imobiliária para vincular
router.get('/:id/cliente', requirePermission('propostas', 'ler'), async (req, res) => {
  const proposta = await prisma.proposta.findUnique({
    where: { id: Number(req.params.id) },
    include: { cliente: true, unidade: true, empreendimento: { select: { nome: true } } },
  });
  if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
  if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
  const leads = await prisma.lead.findMany({
    where: req.user.role === 'super_admin' ? {} : { imobiliariaId: req.user.imobiliariaId },
    select: { id: true, nome: true, telefone: true, email: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json({
    proposta: { id: proposta.id, status: proposta.status, clienteNome: proposta.clienteNome, empreendimento: proposta.empreendimento?.nome, unidade: proposta.unidade?.identificacao || proposta.unidade?.numero },
    cliente: proposta.cliente,
    leads,
  });
});

// PUT /propostas/:id/cliente  -> cria/atualiza o cadastro do cliente (só com proposta aprovada)
router.put('/:id/cliente', requirePermission('propostas', 'atualizar'), async (req, res) => {
  try {
    const proposta = await prisma.proposta.findUnique({ where: { id: Number(req.params.id) }, include: { cliente: true } });
    if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
    if (!canAccess(req.user, proposta)) return res.status(403).json({ error: 'Acesso negado' });
    if (proposta.status !== 'aprovada') return res.status(409).json({ error: 'O cliente só pode ser cadastrado depois que a proposta é aprovada' });

    const data = montarDadosCliente(req.body);
    const nome = data.nome ?? proposta.cliente?.nome ?? proposta.clienteNome;
    const cpf = data.cpf ?? proposta.cliente?.cpf;
    if (!nome?.trim()) return res.status(400).json({ error: 'Informe o nome do cliente' });
    if (!cpf || !validateCpf(cpf)) return res.status(400).json({ error: 'CPF do cliente inválido' });
    if (data.conjugeCpf && !validateCpf(data.conjugeCpf)) return res.status(400).json({ error: 'CPF do cônjuge inválido' });
    if (data.leadId) {
      const lead = await prisma.lead.findFirst({ where: { id: data.leadId, ...(req.user.role === 'super_admin' ? {} : { imobiliariaId: req.user.imobiliariaId }) } });
      if (!lead) return res.status(400).json({ error: 'Lead informado não encontrado' });
    }

    // Concluído quando os campos essenciais da ficha estão preenchidos.
    const merged = { ...proposta.cliente, ...data, nome, cpf };
    data.concluido = Boolean(merged.nome && merged.cpf && merged.rg && merged.estadoCivil && merged.profissao && merged.telefone);

    const cliente = await prisma.cliente.upsert({
      where: { propostaId: proposta.id },
      update: data,
      create: { propostaId: proposta.id, ...data, nome, cpf },
    });
    await logAudit({ userId: req.user.id, acao: proposta.cliente ? 'editar' : 'criar', recurso: 'proposta', recursoId: proposta.id, imobiliariaId: proposta.imobiliariaId, detalhes: { acao: 'cadastro_cliente', concluido: cliente.concluido } });
    res.json(cliente);
  } catch (err) {
    console.error('Erro cliente:', err);
    res.status(500).json({ error: 'Erro ao salvar cliente' });
  }
});

module.exports = router;
