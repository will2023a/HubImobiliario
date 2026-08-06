const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');
const { getAccessibleEmpreendimento, getManageableEmpreendimento } = require('../utils/empreendimento-access');

const router = express.Router();

router.use(auth);

// Criar unidade (vincular ao empreendimento)
router.post('/', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  const { empreendimentoId, numero, valorBase, juros } = req.body;
  
  try {
    if (!await getManageableEmpreendimento(req.user, empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado ou não gerenciável' });
    const valorTotal = parseFloat(valorBase) + parseFloat(juros || 0);
    const unidade = await prisma.unidade.create({
      data: { empreendimentoId: Number(empreendimentoId), numero, identificacao: req.body.identificacao || numero, valorBase: parseFloat(valorBase), juros: parseFloat(juros || 0), valorTotal, tipo: req.body.tipo || null, bloco: req.body.bloco || null, area: req.body.area !== '' && req.body.area !== undefined ? parseFloat(req.body.area) : null, andar: req.body.andar !== '' && req.body.andar !== undefined ? parseInt(req.body.andar) : null, quartos: req.body.quartos !== '' && req.body.quartos !== undefined ? parseInt(req.body.quartos) : null, suites: req.body.suites !== '' && req.body.suites !== undefined ? parseInt(req.body.suites) : null, vagas: req.body.vagas !== '' && req.body.vagas !== undefined ? parseInt(req.body.vagas) : null }
    });
    res.json(unidade);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar unidade', details: err.message });
  }
});

// Listar unidades de um empreendimento
router.get('/empreendimento/:empreendimentoId', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  if (!await getAccessibleEmpreendimento(req.user, req.params.empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado' });
  const unidades = await prisma.unidade.findMany({ 
    where: { empreendimentoId: Number(req.params.empreendimentoId) },
    include: {
      _count: { select: { propostas: true } }
    },
    orderBy: { numero: 'asc' }
  });
  res.json(unidades);
});

// Buscar unidade por ID
router.get('/:id', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  const unidade = await prisma.unidade.findFirst({
    where: { id: Number(req.params.id), empreendimento: req.user.role === 'super_admin' ? {} : { OR: [{ imobiliariaId: req.user.imobiliariaId }, { equipes: { some: { imobiliariaId: req.user.imobiliariaId, ativa: true } } }] } },
    include: { empreendimento: true, propostas: true, reservas: { orderBy: { createdAt: 'desc' } }, historicoStatus: { include: { changedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } } }
  });
  if (!unidade) return res.status(404).json({ error: 'Não encontrada' });
  res.json(unidade);
});

// Atualizar unidade (valores/juros)
router.patch('/:id', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  const { valorBase, juros, status, numero } = req.body;
  const updateData = {};
  
  const unidadeAtual = await prisma.unidade.findUnique({ where: { id: Number(req.params.id) } });
  if (!unidadeAtual || !await getManageableEmpreendimento(req.user, unidadeAtual.empreendimentoId)) return res.status(404).json({ error: 'Unidade não encontrada ou não gerenciável' });
  if (numero !== undefined) { updateData.numero = numero; if (!req.body.identificacao) updateData.identificacao = numero; }
  if (req.body.identificacao !== undefined) updateData.identificacao = req.body.identificacao;
  for (const field of ['tipo', 'bloco']) if (req.body[field] !== undefined) updateData[field] = req.body[field] || null;
  for (const field of ['area', 'andar', 'quartos', 'suites', 'vagas']) if (req.body[field] !== undefined) updateData[field] = req.body[field] === '' ? null : Number(req.body[field]);
  if (status !== undefined) updateData.status = status;
  if (valorBase !== undefined || juros !== undefined) {
    const novoValorBase = valorBase !== undefined ? parseFloat(valorBase) : unidadeAtual.valorBase;
    const novoJuros = juros !== undefined ? parseFloat(juros) : unidadeAtual.juros;
    updateData.valorBase = novoValorBase;
    updateData.juros = novoJuros;
    updateData.valorTotal = novoValorBase + novoJuros;
  }
  
  try {
    const updated = await prisma.$transaction(async tx => {
      const result = await tx.unidade.update({ where: { id: unidadeAtual.id }, data: updateData });
      if (status && status !== unidadeAtual.status) await tx.unidadeStatusHistorico.create({ data: { unidadeId: unidadeAtual.id, statusAnterior: unidadeAtual.status, statusNovo: status, changedById: req.user.id, motivo: req.body.motivo || null } });
      return result;
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao atualizar', details: err.message });
  }
});

// Deletar unidade
router.delete('/:id', requirePermission('empreendimentos', 'deletar'), async (req, res) => {
  try {
    const unidade = await prisma.unidade.findUnique({ where: { id: Number(req.params.id) } });
    if (!unidade || !await getManageableEmpreendimento(req.user, unidade.empreendimentoId)) return res.status(404).json({ error: 'Unidade não encontrada ou não gerenciável' });
    await prisma.unidade.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao deletar', details: err.message });
  }
});

router.post('/:id/reservas', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  const unidadeId = Number(req.params.id);
  const { clienteNome, clienteCpf, horas = 48 } = req.body;
  if (!clienteNome?.trim() || Number(horas) < 1 || Number(horas) > 720) return res.status(400).json({ error: 'Informe o cliente e um prazo entre 1 e 720 horas' });
  try {
    const reserva = await prisma.$transaction(async tx => {
      const unidade = await tx.unidade.findUnique({ where: { id: unidadeId } });
      if (!unidade || !await getAccessibleEmpreendimento(req.user, unidade.empreendimentoId)) { const error = new Error('Unidade não encontrada'); error.code = 'NOT_FOUND'; throw error; }
      const now = new Date();
      const expiradas = await tx.reservaUnidade.findMany({ where: { unidadeId, status: 'ativa', expiresAt: { lte: now } } });
      if (expiradas.length) await tx.reservaUnidade.updateMany({ where: { id: { in: expiradas.map(item => item.id) } }, data: { status: 'expirada' } });
      if (expiradas.length && ['reservada', 'pre_reservada'].includes(unidade.status)) await tx.unidade.update({ where: { id: unidadeId }, data: { status: 'disponivel' } });
      if (await tx.reservaUnidade.findFirst({ where: { unidadeId, status: 'ativa', expiresAt: { gt: now } } })) { const error = new Error('Unidade já possui uma reserva ativa'); error.code = 'ALREADY_RESERVED'; throw error; }
      const claimed = await tx.unidade.updateMany({ where: { id: unidadeId, status: 'disponivel' }, data: { status: 'reservada' } });
      if (!claimed.count) { const error = new Error('Unidade não está disponível'); error.code = 'NOT_AVAILABLE'; throw error; }
      const created = await tx.reservaUnidade.create({ data: { unidadeId, createdById: req.user.id, clienteNome: clienteNome.trim(), clienteCpf: clienteCpf?.trim() || null, expiresAt: new Date(now.getTime() + Number(horas) * 3600000) } });
      await tx.unidadeStatusHistorico.create({ data: { unidadeId, statusAnterior: 'disponivel', statusNovo: 'reservada', changedById: req.user.id, motivo: `Reserva #${created.id}` } });
      return created;
    }, { isolationLevel: 'Serializable' });
    res.status(201).json(reserva);
  } catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : ['ALREADY_RESERVED', 'NOT_AVAILABLE', 'P2034'].includes(err.code) ? 409 : 400;
    res.status(status).json({ error: err.code === 'P2034' ? 'Conflito de reserva; tente novamente' : err.message, code: err.code });
  }
});

router.patch('/:id/reservas/:reservaId/cancelar', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  const unidadeId = Number(req.params.id);
  const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId } });
  if (!unidade || !await getAccessibleEmpreendimento(req.user, unidade.empreendimentoId)) return res.status(404).json({ error: 'Unidade não encontrada' });
  const reserva = await prisma.reservaUnidade.findFirst({ where: { id: Number(req.params.reservaId), unidadeId, status: 'ativa' } });
  if (!reserva) return res.status(404).json({ error: 'Reserva ativa não encontrada' });
  await prisma.$transaction([
    prisma.reservaUnidade.update({ where: { id: reserva.id }, data: { status: 'cancelada', cancelledAt: new Date(), motivoCancelamento: req.body.motivo?.trim() || null } }),
    prisma.unidade.update({ where: { id: unidadeId }, data: { status: 'disponivel' } }),
    prisma.unidadeStatusHistorico.create({ data: { unidadeId, statusAnterior: unidade.status, statusNovo: 'disponivel', changedById: req.user.id, motivo: req.body.motivo?.trim() || `Cancelamento da reserva #${reserva.id}` } })
  ]);
  res.json({ ok: true });
});

module.exports = router;
