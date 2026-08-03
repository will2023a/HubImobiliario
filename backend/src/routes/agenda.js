const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /agenda/events - Listar eventos
router.get('/events', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);
    const { start, end, tipo } = req.query;
    const where = { imobiliariaId: req.user.imobiliariaId };

    // Role filter
    if (req.user.role === 'corretor') {
      where.userId = req.user.id;
    }

    if (tipo) where.tipo = tipo;
    if (start) where.dataInicio = { gte: new Date(start) };
    if (end) where.dataInicio = { ...where.dataInicio, lte: new Date(end) };

    const events = await prisma.agendaEvent.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, nome: true } }
      },
      orderBy: { dataInicio: 'asc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Erro agenda:', error);
    res.status(500).json({ error: 'Erro ao buscar eventos' });
  }
});

// POST /agenda/events - Criar evento
router.post('/events', authenticate, async (req, res) => {
  try {
    const { titulo, descricao, tipo, dataInicio, dataFim, allDay, leadId, lembrete } = req.body;
    if (!titulo || !dataInicio) return res.status(400).json({ error: 'Título e data de início são obrigatórios' });

    const event = await prisma.agendaEvent.create({
      data: {
        titulo,
        descricao: descricao || null,
        tipo: tipo || 'evento',
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        allDay: allDay || false,
        userId: req.user.id,
        leadId: leadId ? parseInt(leadId) : null,
        lembrete: lembrete ? parseInt(lembrete) : null,
        imobiliariaId: req.user.imobiliariaId
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Erro criar evento:', error);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

// PUT /agenda/events/:id - Atualizar evento (inclui reagendar)
router.put('/events/:id', authenticate, async (req, res) => {
  try {
    const { titulo, descricao, tipo, dataInicio, dataFim, allDay, lembrete } = req.body;

    const event = await prisma.agendaEvent.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(titulo && { titulo }),
        ...(descricao !== undefined && { descricao }),
        ...(tipo && { tipo }),
        ...(dataInicio && { dataInicio: new Date(dataInicio) }),
        ...(dataFim !== undefined && { dataFim: dataFim ? new Date(dataFim) : null }),
        ...(allDay !== undefined && { allDay }),
        ...(lembrete !== undefined && { lembrete: lembrete ? parseInt(lembrete) : null }),
      }
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

// DELETE /agenda/events/:id - Cancelar evento
router.delete('/events/:id', authenticate, async (req, res) => {
  try {
    await prisma.agendaEvent.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Evento removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover evento' });
  }
});

module.exports = router;
