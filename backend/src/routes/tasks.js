const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /tasks - Listar tarefas (filtros: tipo, status, lead)
router.get('/', authenticate, async (req, res) => {
  try {
    const { tipo, status, leadId, page = 1, limit = 20 } = req.query;
    const where = {};

    // If user has imobiliaria, filter by it
    if (req.user.imobiliariaId) {
      where.imobiliariaId = req.user.imobiliariaId;
    } else {
      // super_admin without imobiliaria — return empty
      return res.json({ tasks: [], total: 0, page: 1, limit: parseInt(limit) });
    }

    // Role-based filtering
    if (req.user.role === 'corretor') {
      where.userId = req.user.id;
    } else if (req.user.role === 'gerente') {
      const corretores = await prisma.user.findMany({
        where: { gerenteId: req.user.id }, select: { id: true }
      });
      where.userId = { in: [req.user.id, ...corretores.map(c => c.id)] };
    }

    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    if (leadId) where.leadId = parseInt(leadId);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, nome: true } }
      },
      orderBy: [{ status: 'asc' }, { prazo: 'asc' }],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.task.count({ where });
    res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Erro tasks:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// POST /tasks - Criar tarefa
router.post('/', authenticate, async (req, res) => {
  try {
    const { titulo, descricao, tipo, prioridade, prazo, leadId, userId } = req.body;

    if (!titulo || !prazo) {
      return res.status(400).json({ error: 'Título e prazo são obrigatórios' });
    }

    const task = await prisma.task.create({
      data: {
        titulo,
        descricao: descricao || null,
        tipo: tipo || 'outro',
        prioridade: prioridade || 'media',
        prazo: new Date(prazo),
        userId: userId || req.user.id,
        leadId: leadId ? parseInt(leadId) : null,
        imobiliariaId: req.user.imobiliariaId
      },
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, nome: true } }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Erro criar task:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

// PUT /tasks/:id - Atualizar tarefa
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, prioridade, prazo, status } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        ...(titulo && { titulo }),
        ...(descricao !== undefined && { descricao }),
        ...(tipo && { tipo }),
        ...(prioridade && { prioridade }),
        ...(prazo && { prazo: new Date(prazo) }),
        ...(status && { status })
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// PUT /tasks/:id/complete - Marcar como concluída
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'concluida', concluidaEm: new Date() }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao concluir tarefa' });
  }
});

// DELETE /tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Tarefa removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover tarefa' });
  }
});

module.exports = router;
