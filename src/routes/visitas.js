const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.use(auth);

// Criar visita
router.post('/', requirePermission('visitas', 'criar'), async (req, res) => {
  const {
    nomeVisitante,
    telefoneVisitante,
    emailVisitante,
    tipo,
    empreendimentoId,
    unidadeId,
    imobiliariaId,
    atendenteId,
    dataVisita,
    observacoes
  } = req.body;

  // Validações
  if (!nomeVisitante || !tipo || !empreendimentoId) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: nomeVisitante, tipo, empreendimentoId' 
    });
  }

  if (!['agendada', 'espontanea'].includes(tipo)) {
    return res.status(400).json({ 
      error: 'Tipo deve ser "agendada" ou "espontanea"' 
    });
  }

  try {
    const visita = await prisma.visita.create({
      data: {
        nomeVisitante,
        telefoneVisitante,
        emailVisitante,
        tipo,
        empreendimentoId: parseInt(empreendimentoId),
        unidadeId: unidadeId ? parseInt(unidadeId) : null,
        imobiliariaId: imobiliariaId ? parseInt(imobiliariaId) : null,
        atendenteId: atendenteId ? parseInt(atendenteId) : req.user.id,
        dataVisita: dataVisita ? new Date(dataVisita) : new Date(),
        observacoes
      },
      include: {
        empreendimento: true,
        unidade: true,
        imobiliaria: true,
        atendente: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(visita);
  } catch (err) {
    console.error('Erro ao criar visita:', err);
    res.status(400).json({ 
      error: 'Erro ao criar visita', 
      details: err.message 
    });
  }
});

// Listar visitas (filtradas por role)
router.get('/', requirePermission('visitas', 'ler'), async (req, res) => {
  const where = {};

  // Corretores só veem suas próprias visitas
  if (req.user.role === 'corretor') {
    where.atendenteId = req.user.id;
  }
  // Gerentes veem visitas de seus corretores
  else if (req.user.role === 'gerente') {
    const subordinados = await prisma.user.findMany({
      where: { gerenteId: req.user.id },
      select: { id: true }
    });
    where.atendenteId = { 
      in: subordinados.map(s => s.id).concat(req.user.id) 
    };
  }
  // Diretores veem visitas de sua hierarquia
  else if (req.user.role === 'diretor') {
    const gerentes = await prisma.user.findMany({
      where: { diretorId: req.user.id },
      select: { id: true }
    });
    const gerentesIds = gerentes.map(g => g.id);
    
    const corretores = await prisma.user.findMany({
      where: { gerenteId: { in: gerentesIds } },
      select: { id: true }
    });
    
    where.atendenteId = { 
      in: [...gerentesIds, ...corretores.map(c => c.id), req.user.id] 
    };
  }

  try {
    const visitas = await prisma.visita.findMany({
      where,
      include: {
        empreendimento: { select: { id: true, nome: true } },
        unidade: { select: { id: true, numero: true, bloco: true } },
        imobiliaria: { select: { id: true, nome: true } },
        atendente: { select: { id: true, name: true, email: true } }
      },
      orderBy: { dataVisita: 'desc' }
    });

    res.json(visitas);
  } catch (err) {
    console.error('Erro ao listar visitas:', err);
    res.status(400).json({ 
      error: 'Erro ao listar visitas', 
      details: err.message 
    });
  }
});

// Buscar visita por ID
router.get('/:id', requirePermission('visitas', 'ler'), async (req, res) => {
  try {
    const visita = await prisma.visita.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empreendimento: true,
        unidade: true,
        imobiliaria: true,
        atendente: { select: { id: true, name: true, email: true } }
      }
    });

    if (!visita) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    res.json(visita);
  } catch (err) {
    console.error('Erro ao buscar visita:', err);
    res.status(400).json({ 
      error: 'Erro ao buscar visita', 
      details: err.message 
    });
  }
});

// Atualizar visita
router.put('/:id', requirePermission('visitas', 'editar'), async (req, res) => {
  const {
    nomeVisitante,
    telefoneVisitante,
    emailVisitante,
    tipo,
    observacoes
  } = req.body;

  try {
    const visita = await prisma.visita.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nomeVisitante,
        telefoneVisitante,
        emailVisitante,
        tipo,
        observacoes
      },
      include: {
        empreendimento: true,
        unidade: true,
        imobiliaria: true,
        atendente: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(visita);
  } catch (err) {
    console.error('Erro ao atualizar visita:', err);
    res.status(400).json({ 
      error: 'Erro ao atualizar visita', 
      details: err.message 
    });
  }
});

// Deletar visita
router.delete('/:id', requirePermission('visitas', 'deletar'), async (req, res) => {
  try {
    await prisma.visita.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Visita deletada com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar visita:', err);
    res.status(400).json({ 
      error: 'Erro ao deletar visita', 
      details: err.message 
    });
  }
});

module.exports = router;
