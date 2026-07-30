const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /search?q=termo - Busca global
router.get('/', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ leads: [], imoveis: [], empreendimentos: [], propostas: [] });
    }

    const imobiliariaId = req.user.imobiliariaId;
    const searchTerm = `%${q}%`;

    // Search leads
    const leadWhere = {
      imobiliariaId,
      OR: [
        { nome: { contains: q } },
        { email: { contains: q } },
        { telefone: { contains: q } }
      ]
    };
    if (req.user.role === 'corretor') leadWhere.corretorId = req.user.id;

    const leads = await prisma.lead.findMany({
      where: leadWhere,
      take: 5,
      select: { id: true, nome: true, telefone: true, status: true }
    });

    // Search imoveis
    const imoveis = await prisma.imovel.findMany({
      where: {
        imobiliariaId,
        OR: [
          { titulo: { contains: q } },
          { endereco: { contains: q } },
          { cidade: { contains: q } }
        ]
      },
      take: 5,
      select: { id: true, titulo: true, cidade: true, valor: true }
    });

    // Search empreendimentos
    const empreendimentos = await prisma.empreendimento.findMany({
      where: {
        imobiliariaId,
        OR: [
          { nome: { contains: q } },
          { cidade: { contains: q } },
          { bairro: { contains: q } }
        ]
      },
      take: 5,
      select: { id: true, nome: true, cidade: true, tipoUnidade: true }
    });

    // Search propostas by client name
    const propostaWhere = {
      imobiliariaId,
      OR: [
        { clienteNome: { contains: q } },
        { clienteSobrenome: { contains: q } },
        { clienteCpf: { contains: q } }
      ]
    };
    if (req.user.role === 'corretor') propostaWhere.corretorId = req.user.id;

    const propostas = await prisma.proposta.findMany({
      where: propostaWhere,
      take: 5,
      select: { id: true, clienteNome: true, clienteSobrenome: true, status: true }
    });

    res.json({ leads, imoveis, empreendimentos, propostas });
  } catch (error) {
    console.error('Erro busca:', error);
    res.status(500).json({ error: 'Erro na busca' });
  }
});

module.exports = router;
