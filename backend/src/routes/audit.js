const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /audit - Listar logs de auditoria
router.get('/', authenticate, async (req, res) => {
  try {
    if (!['super_admin', 'admin_imobiliaria'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { userId, acao, recurso, page = 1, limit = 30 } = req.query;
    const where = {};

    if (req.user.role === 'admin_imobiliaria') {
      where.imobiliariaId = req.user.imobiliariaId;
    }
    if (userId) where.userId = parseInt(userId);
    if (acao) where.acao = acao;
    if (recurso) where.recurso = recurso;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Erro audit:', error);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

module.exports = router;
