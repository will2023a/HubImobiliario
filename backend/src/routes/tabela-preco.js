const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');
const { getAccessibleEmpreendimento, getManageableEmpreendimento } = require('../utils/empreendimento-access');
const { resolverTabela } = require('../utils/analise-proposta');

const TIPOS_SERIE = ['ato', 'pontual', 'mensal', 'semestral', 'anual', 'unica', 'financiamento'];

async function getTable(req, id, manage = false) {
  const table = await prisma.tabelaPreco.findUnique({ where: { id: Number(id) } });
  if (!table) return null;
  return (manage ? await getManageableEmpreendimento(req.user, table.empreendimentoId) : await getAccessibleEmpreendimento(req.user, table.empreendimentoId)) ? table : null;
}

async function getSerieTable(req, serieId) {
  const serie = await prisma.tabelaPrecoSerie.findUnique({ where: { id: Number(serieId) }, include: { tabela: true } });
  return serie && await getManageableEmpreendimento(req.user, serie.tabela.empreendimentoId) ? serie : null;
}

// Normaliza e calcula o % de cada série sobre o total.
function normalizeSeries(series = []) {
  const parsed = series.map((s, idx) => ({
    nome: String(s.nome || '').trim() || 'Série',
    tipo: TIPOS_SERIE.includes(s.tipo) ? s.tipo : 'pontual',
    inicioMes: Math.min(12, Math.max(1, parseInt(s.inicioMes, 10) || 1)),
    inicioAno: parseInt(s.inicioAno, 10) || new Date().getFullYear(),
    valor: parseFloat(s.valor) || 0,
    quantidade: Math.max(1, parseInt(s.quantidade, 10) || 1),
    periodicidade: Math.max(1, parseInt(s.periodicidade, 10) || 1),
    aposHabitese: Boolean(s.aposHabitese),
    observacao: s.observacao || null,
    unidadeId: s.unidadeId ? parseInt(s.unidadeId, 10) : null,
    ordem: s.ordem != null ? parseInt(s.ordem, 10) : idx,
  }));
  const total = parsed.reduce((acc, s) => acc + s.valor * s.quantidade, 0);
  return parsed.map((s) => ({ ...s, percentualTotal: total ? Math.round((s.valor * s.quantidade / total) * 10000) / 100 : null }));
}

const dateOrNull = (v) => (v ? new Date(v) : null);

// GET /tabela-preco/:empreendimentoId - listar tabelas do empreendimento
router.get('/:empreendimentoId', authenticate, async (req, res) => {
  try {
    if (!await getAccessibleEmpreendimento(req.user, req.params.empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado' });
    const tabelas = await prisma.tabelaPreco.findMany({
      where: { empreendimentoId: parseInt(req.params.empreendimentoId, 10) },
      include: {
        series: { orderBy: { ordem: 'asc' } },
        _count: { select: { series: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tabelas);
  } catch (error) {
    console.error('Erro tabelas:', error);
    res.status(500).json({ error: 'Erro ao buscar tabelas' });
  }
});

// GET /tabela-preco/tabela/:id/resolvida?unidadeId= - tabela aplicada a uma unidade
router.get('/tabela/:id/resolvida', authenticate, async (req, res) => {
  try {
    const tabela = await prisma.tabelaPreco.findUnique({
      where: { id: Number(req.params.id) },
      include: { series: { orderBy: { ordem: 'asc' } }, empreendimento: true },
    });
    if (!tabela || !await getAccessibleEmpreendimento(req.user, tabela.empreendimentoId)) return res.status(404).json({ error: 'Tabela não encontrada' });
    let unidade = null;
    if (req.query.unidadeId) {
      unidade = await prisma.unidade.findFirst({ where: { id: Number(req.query.unidadeId), empreendimentoId: tabela.empreendimentoId } });
      if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada' });
    }
    const resolvida = resolverTabela(tabela, unidade || {}, tabela.empreendimento);
    res.json({ tabela: { id: tabela.id, nome: tabela.nome, validadeInicio: tabela.validadeInicio, validadeFim: tabela.validadeFim }, unidade, ...resolvida });
  } catch (error) {
    console.error('Erro resolver tabela:', error);
    res.status(500).json({ error: 'Erro ao resolver tabela' });
  }
});

// POST /tabela-preco - criar tabela
router.post('/', authenticate, async (req, res) => {
  try {
    const { empreendimentoId, nome, grupo, modelo, incluirDesconto, incluirJuros, tipologia, validadeInicio, validadeFim, series } = req.body;
    if (!empreendimentoId || !nome) return res.status(400).json({ error: 'empreendimentoId e nome são obrigatórios' });
    if (!await getManageableEmpreendimento(req.user, empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado ou não gerenciável' });

    const tabela = await prisma.tabelaPreco.create({
      data: {
        empreendimentoId: parseInt(empreendimentoId, 10),
        nome,
        grupo: grupo || 'padrao',
        modelo: modelo || 'modelo_1',
        incluirDesconto: Boolean(incluirDesconto),
        incluirJuros: Boolean(incluirJuros),
        tipologia: tipologia || null,
        validadeInicio: dateOrNull(validadeInicio),
        validadeFim: dateOrNull(validadeFim),
        series: series?.length ? { create: normalizeSeries(series) } : undefined,
      },
      include: { series: { orderBy: { ordem: 'asc' } } },
    });
    res.status(201).json(tabela);
  } catch (error) {
    console.error('Erro criar tabela:', error);
    res.status(500).json({ error: 'Erro ao criar tabela' });
  }
});

// PUT /tabela-preco/:id - atualizar cabeçalho da tabela
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nome, grupo, modelo, incluirDesconto, incluirJuros, ativa, tipologia, validadeInicio, validadeFim } = req.body;
    if (!await getTable(req, req.params.id, true)) return res.status(404).json({ error: 'Tabela não encontrada ou não gerenciável' });
    const tabela = await prisma.tabelaPreco.update({
      where: { id: parseInt(req.params.id, 10) },
      data: {
        ...(nome && { nome }),
        ...(grupo && { grupo }),
        ...(modelo && { modelo }),
        ...(incluirDesconto !== undefined && { incluirDesconto: Boolean(incluirDesconto) }),
        ...(incluirJuros !== undefined && { incluirJuros: Boolean(incluirJuros) }),
        ...(ativa !== undefined && { ativa: Boolean(ativa) }),
        ...(tipologia !== undefined && { tipologia: tipologia || null }),
        ...(validadeInicio !== undefined && { validadeInicio: dateOrNull(validadeInicio) }),
        ...(validadeFim !== undefined && { validadeFim: dateOrNull(validadeFim) }),
      },
    });
    res.json(tabela);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tabela' });
  }
});

// PUT /tabela-preco/:id/series - substitui todas as séries da tabela
router.put('/:id/series', authenticate, async (req, res) => {
  try {
    if (!await getTable(req, req.params.id, true)) return res.status(404).json({ error: 'Tabela não encontrada ou não gerenciável' });
    const tabelaId = parseInt(req.params.id, 10);
    const series = normalizeSeries(req.body.series || []);
    await prisma.$transaction([
      prisma.tabelaPrecoSerie.deleteMany({ where: { tabelaId } }),
      ...(series.length ? [prisma.tabelaPrecoSerie.createMany({ data: series.map((s) => ({ ...s, tabelaId })) })] : []),
    ]);
    const tabela = await prisma.tabelaPreco.findUnique({ where: { id: tabelaId }, include: { series: { orderBy: { ordem: 'asc' } } } });
    res.json(tabela);
  } catch (error) {
    console.error('Erro salvar séries:', error);
    res.status(500).json({ error: 'Erro ao salvar séries' });
  }
});

// POST /tabela-preco/:id/series - adicionar uma série
router.post('/:id/series', authenticate, async (req, res) => {
  try {
    if (!await getTable(req, req.params.id, true)) return res.status(404).json({ error: 'Tabela não encontrada ou não gerenciável' });
    const tabelaId = parseInt(req.params.id, 10);
    const last = await prisma.tabelaPrecoSerie.findFirst({ where: { tabelaId }, orderBy: { ordem: 'desc' } });
    const [serie] = normalizeSeries([{ ...req.body, ordem: (last?.ordem ?? -1) + 1 }]);
    const created = await prisma.tabelaPrecoSerie.create({ data: { ...serie, tabelaId } });
    res.status(201).json(created);
  } catch (error) {
    console.error('Erro criar série:', error);
    res.status(500).json({ error: 'Erro ao criar série' });
  }
});

// PUT /tabela-preco/series/:serieId - atualizar uma série
router.put('/series/:serieId', authenticate, async (req, res) => {
  try {
    const atual = await getSerieTable(req, req.params.serieId);
    if (!atual) return res.status(404).json({ error: 'Série não encontrada ou não gerenciável' });
    const [serie] = normalizeSeries([{ ...atual, ...req.body }]);
    const updated = await prisma.tabelaPrecoSerie.update({ where: { id: atual.id }, data: serie });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar série' });
  }
});

// DELETE /tabela-preco/series/:serieId
router.delete('/series/:serieId', authenticate, async (req, res) => {
  try {
    const serie = await getSerieTable(req, req.params.serieId);
    if (!serie) return res.status(404).json({ error: 'Série não encontrada ou não gerenciável' });
    await prisma.tabelaPrecoSerie.delete({ where: { id: serie.id } });
    res.json({ message: 'Série removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover série' });
  }
});

// DELETE /tabela-preco/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!await getTable(req, req.params.id, true)) return res.status(404).json({ error: 'Tabela não encontrada ou não gerenciável' });
    await prisma.tabelaPreco.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ message: 'Tabela removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover tabela' });
  }
});

module.exports = router;
