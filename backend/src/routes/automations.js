const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /automations - Listar automações
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);
    const automations = await prisma.automation.findMany({
      where: { imobiliariaId: req.user.imobiliariaId },
      include: { _count: { select: { executions: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(automations);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar automações' });
  }
});

// GET /automations/:id - Detalhes
router.get('/:id', authenticate, async (req, res) => {
  try {
    const automation = await prisma.automation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { executions: { take: 10, orderBy: { startedAt: 'desc' } } }
    });
    if (!automation) return res.status(404).json({ error: 'Automação não encontrada' });
    res.json(automation);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// POST /automations - Criar
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.status(400).json({ error: 'Imobiliária necessária' });
    const { nome, descricao, gatilho, nodes, edges } = req.body;
    if (!nome || !gatilho) return res.status(400).json({ error: 'Nome e gatilho são obrigatórios' });

    const automation = await prisma.automation.create({
      data: {
        nome,
        descricao: descricao || null,
        gatilho,
        nodes: nodes || [],
        edges: edges || [],
        imobiliariaId: req.user.imobiliariaId
      }
    });
    res.status(201).json(automation);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar automação' });
  }
});

// PUT /automations/:id - Atualizar (salvar fluxo)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nome, descricao, gatilho, nodes, edges, status } = req.body;
    const automation = await prisma.automation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(gatilho && { gatilho }),
        ...(nodes && { nodes }),
        ...(edges && { edges }),
        ...(status && { status }),
      }
    });
    res.json(automation);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// PUT /automations/:id/toggle - Ativar/Desativar
router.put('/:id/toggle', authenticate, async (req, res) => {
  try {
    const current = await prisma.automation.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!current) return res.status(404).json({ error: 'Não encontrada' });

    const newStatus = current.status === 'ativo' ? 'inativo' : 'ativo';
    const automation = await prisma.automation.update({
      where: { id: parseInt(req.params.id) },
      data: { status: newStatus }
    });
    res.json(automation);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

// DELETE /automations/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.automation.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Automação removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover' });
  }
});

module.exports = router;
