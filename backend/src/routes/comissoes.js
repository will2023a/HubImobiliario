const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /comissoes - Listar comissões
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);
    const { status, userId, page = 1, limit = 20 } = req.query;
    const where = { imobiliariaId: req.user.imobiliariaId };

    if (req.user.role === 'corretor') where.userId = req.user.id;
    if (status) where.status = status;
    if (userId) where.userId = parseInt(userId);

    const comissoes = await prisma.comissao.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
        proposta: { select: { id: true, clienteNome: true, clienteSobrenome: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const totals = await prisma.comissao.aggregate({
      where,
      _sum: { valorComissao: true, valorVenda: true },
      _count: true
    });

    const pendentes = await prisma.comissao.aggregate({
      where: { ...where, status: 'pendente' },
      _sum: { valorComissao: true }
    });

    res.json({
      comissoes,
      totais: {
        total: totals._count,
        valorVendas: totals._sum.valorVenda || 0,
        valorComissoes: totals._sum.valorComissao || 0,
        pendentes: pendentes._sum.valorComissao || 0,
      }
    });
  } catch (error) {
    console.error('Erro comissões:', error);
    res.status(500).json({ error: 'Erro ao buscar comissões' });
  }
});

// PUT /comissoes/:id/pagar - Marcar como paga
router.put('/:id/pagar', authenticate, async (req, res) => {
  try {
    if (!['super_admin', 'admin_imobiliaria'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const comissao = await prisma.comissao.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'paga', dataPagamento: new Date() }
    });

    res.json(comissao);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao pagar comissão' });
  }
});

module.exports = router;
