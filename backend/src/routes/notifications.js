const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /notifications - Listar notificações do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const where = { userId: req.user.id };
    if (unread === 'true') where.lida = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, lida: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// PUT /notifications/:id/read - Marcar como lida
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { lida: true }
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
});

// PUT /notifications/read-all - Marcar todas como lidas
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, lida: false },
      data: { lida: true }
    });
    res.json({ message: 'Todas notificações marcadas como lidas' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
});

module.exports = router;
