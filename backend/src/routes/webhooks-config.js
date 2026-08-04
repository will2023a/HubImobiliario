const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');
const crypto = require('crypto');

// GET /webhooks-config - Listar webhooks configurados
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);
    const webhooks = await prisma.webhook.findMany({
      where: { imobiliariaId: req.user.imobiliariaId },
      include: { _count: { select: { deliveries: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar webhooks' });
  }
});

// POST /webhooks-config - Criar webhook
router.post('/', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.status(400).json({ error: 'Imobiliária necessária' });
    const { url, eventos } = req.body;
    if (!url || !eventos) return res.status(400).json({ error: 'URL e eventos são obrigatórios' });

    const webhook = await prisma.webhook.create({
      data: {
        url,
        eventos: eventos,
        secretKey: crypto.randomBytes(32).toString('hex'),
        imobiliariaId: req.user.imobiliariaId
      }
    });
    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar webhook' });
  }
});

// PUT /webhooks-config/:id - Atualizar
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { url, eventos, ativo } = req.body;
    const webhook = await prisma.webhook.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(url && { url }),
        ...(eventos && { eventos }),
        ...(ativo !== undefined && { ativo }),
      }
    });
    res.json(webhook);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// DELETE /webhooks-config/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.webhook.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Webhook removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover' });
  }
});

// GET /webhooks-config/:id/deliveries - Log de entregas
router.get('/:id/deliveries', authenticate, async (req, res) => {
  try {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: parseInt(req.params.id) },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
