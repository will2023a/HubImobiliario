const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.use(auth);

// Criar unidade (vincular ao empreendimento)
router.post('/', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  const { empreendimentoId, numero, valorBase, juros } = req.body;
  
  try {
    const valorTotal = parseFloat(valorBase) + parseFloat(juros || 0);
    const unidade = await prisma.unidade.create({ 
      data: { empreendimentoId: Number(empreendimentoId), numero, valorBase, juros: juros || 0, valorTotal } 
    });
    res.json(unidade);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar unidade', details: err.message });
  }
});

// Listar unidades de um empreendimento
router.get('/empreendimento/:empreendimentoId', requirePermission('empreendimentos', 'ler'), async (req, res) => {
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
  const unidade = await prisma.unidade.findUnique({ 
    where: { id: Number(req.params.id) },
    include: { empreendimento: true, propostas: true }
  });
  if (!unidade) return res.status(404).json({ error: 'Não encontrada' });
  res.json(unidade);
});

// Atualizar unidade (valores/juros)
router.patch('/:id', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  const { valorBase, juros, status, numero } = req.body;
  const updateData = {};
  
  if (numero !== undefined) updateData.numero = numero;
  if (status !== undefined) updateData.status = status;
  if (valorBase !== undefined || juros !== undefined) {
    const unidade = await prisma.unidade.findUnique({ where: { id: Number(req.params.id) } });
    const novoValorBase = valorBase !== undefined ? parseFloat(valorBase) : unidade.valorBase;
    const novoJuros = juros !== undefined ? parseFloat(juros) : unidade.juros;
    updateData.valorBase = novoValorBase;
    updateData.juros = novoJuros;
    updateData.valorTotal = novoValorBase + novoJuros;
  }
  
  try {
    const updated = await prisma.unidade.update({ where: { id: Number(req.params.id) }, data: updateData });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao atualizar', details: err.message });
  }
});

// Deletar unidade
router.delete('/:id', requirePermission('empreendimentos', 'deletar'), async (req, res) => {
  try {
    await prisma.unidade.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao deletar', details: err.message });
  }
});

module.exports = router;
