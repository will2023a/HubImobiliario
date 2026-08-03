const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /analytics/dashboard - Dados do dashboard BI
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json({ leads: 0, propostas: 0, vendas: 0, conversao: 0 });

    const imobId = req.user.imobiliariaId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalLeads, leadsUltimos30, totalPropostas, propostasAprovadas, totalUnidadesVendidas] = await Promise.all([
      prisma.lead.count({ where: { imobiliariaId: imobId } }),
      prisma.lead.count({ where: { imobiliariaId: imobId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.proposta.count({ where: { imobiliariaId: imobId } }),
      prisma.proposta.count({ where: { imobiliariaId: imobId, status: 'aprovada' } }),
      prisma.unidade.count({ where: { empreendimento: { imobiliariaId: imobId }, status: 'vendido' } }),
    ]);

    const conversao = totalLeads > 0 ? ((propostasAprovadas / totalLeads) * 100).toFixed(1) : 0;

    res.json({
      totalLeads,
      leadsUltimos30,
      totalPropostas,
      propostasAprovadas,
      totalUnidadesVendidas,
      conversao: parseFloat(conversao),
    });
  } catch (error) {
    console.error('Erro analytics dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

// GET /analytics/funnel - Dados do funil
router.get('/funnel', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);
    const imobId = req.user.imobiliariaId;

    const stages = ['novo', 'em_contato', 'qualificado', 'proposta', 'fechado', 'perdido'];
    const funnel = await Promise.all(
      stages.map(async (status) => ({
        stage: status,
        count: await prisma.lead.count({ where: { imobiliariaId: imobId, status } })
      }))
    );

    res.json(funnel);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar funil' });
  }
});

// GET /analytics/ranking - Ranking de corretores
router.get('/ranking', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);
    const imobId = req.user.imobiliariaId;

    const corretores = await prisma.user.findMany({
      where: { imobiliariaId: imobId, role: 'corretor' },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            propostas: true,
            leadsAsCorretor: true,
          }
        }
      }
    });

    // Get approved proposals count per corretor
    const ranking = await Promise.all(corretores.map(async (c) => {
      const vendas = await prisma.proposta.count({
        where: { corretorId: c.id, status: 'aprovada' }
      });
      return {
        id: c.id,
        name: c.name,
        leads: c._count.leadsAsCorretor,
        propostas: c._count.propostas,
        vendas,
      };
    }));

    ranking.sort((a, b) => b.vendas - a.vendas);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// GET /analytics/leads-by-origin - Leads por origem
router.get('/leads-by-origin', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);

    const leads = await prisma.lead.groupBy({
      by: ['origem'],
      where: { imobiliariaId: req.user.imobiliariaId },
      _count: true
    });

    res.json(leads.map(l => ({ origem: l.origem, count: l._count })));
  } catch (error) {
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
