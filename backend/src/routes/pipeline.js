const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /pipeline/stages - Listar estágios do pipeline
router.get('/stages', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) {
      return res.json([]);
    }
    const stages = await prisma.pipelineStage.findMany({
      where: { imobiliariaId: req.user.imobiliariaId },
      orderBy: { ordem: 'asc' },
      include: {
        _count: { select: { leads: true } }
      }
    });
    res.json(stages);
  } catch (error) {
    console.error('Erro stages:', error);
    res.status(500).json({ error: 'Erro ao buscar estágios' });
  }
});

// POST /pipeline/stages - Criar estágios (seed inicial ou reordenar)
router.post('/stages', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) {
      return res.status(400).json({ error: 'Usuário não pertence a uma imobiliária' });
    }
    const { stages } = req.body; // Array de { nome, ordem, cor }
    if (!stages || !Array.isArray(stages)) {
      return res.status(400).json({ error: 'Array de stages é obrigatório' });
    }

    // Deletar estágios existentes sem leads e recriar
    const results = [];
    for (const stage of stages) {
      const created = await prisma.pipelineStage.upsert({
        where: {
          imobiliariaId_ordem: {
            imobiliariaId: req.user.imobiliariaId,
            ordem: stage.ordem
          }
        },
        update: { nome: stage.nome, cor: stage.cor || '#3b82f6' },
        create: {
          nome: stage.nome,
          ordem: stage.ordem,
          cor: stage.cor || '#3b82f6',
          imobiliariaId: req.user.imobiliariaId
        }
      });
      results.push(created);
    }
    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar estágios' });
  }
});

// GET /pipeline/leads - Leads no pipeline com filtros
router.get('/leads', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) {
      return res.json([]);
    }
    const { stageId, temperatura, corretorId } = req.query;
    const where = {};

    // Filter by stage
    if (stageId) where.stageId = parseInt(stageId);

    // Filter by temperature
    if (temperatura) where.temperatura = temperatura;

    // Filter leads by imobiliaria via lead relation
    const leadWhere = { imobiliariaId: req.user.imobiliariaId };

    // Role-based filtering
    if (req.user.role === 'corretor') {
      leadWhere.corretorId = req.user.id;
    } else if (req.user.role === 'gerente') {
      const corretores = await prisma.user.findMany({
        where: { gerenteId: req.user.id },
        select: { id: true }
      });
      leadWhere.corretorId = { in: [req.user.id, ...corretores.map(c => c.id)] };
    }

    if (corretorId) leadWhere.corretorId = parseInt(corretorId);

    const pipelineLeads = await prisma.leadPipeline.findMany({
      where: {
        ...where,
        lead: leadWhere
      },
      include: {
        lead: {
          include: { corretor: { select: { id: true, name: true } } }
        },
        stage: true
      },
      orderBy: { enteredStageAt: 'desc' }
    });

    res.json(pipelineLeads);
  } catch (error) {
    console.error('Erro pipeline leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads no pipeline' });
  }
});

// PUT /pipeline/leads/:id/stage - Mover lead entre estágios
router.put('/leads/:id/stage', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { stageId, temperatura } = req.body;

    if (!stageId) {
      return res.status(400).json({ error: 'stageId é obrigatório' });
    }

    // Verify stage belongs to same imobiliaria
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: parseInt(stageId), imobiliariaId: req.user.imobiliariaId }
    });
    if (!stage) {
      return res.status(404).json({ error: 'Estágio não encontrado' });
    }

    const updateData = {
      stageId: parseInt(stageId),
      enteredStageAt: new Date()
    };
    if (temperatura) updateData.temperatura = temperatura;

    const updated = await prisma.leadPipeline.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { lead: true, stage: true }
    });

    // Also update lead status to match stage name
    await prisma.lead.update({
      where: { id: updated.leadId },
      data: { status: stage.nome.toLowerCase().replace(/\s+/g, '_') }
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao mover lead:', error);
    res.status(500).json({ error: 'Erro ao mover lead' });
  }
});

// POST /pipeline/leads/:leadId/add - Adicionar lead ao pipeline
router.post('/leads/:leadId/add', authenticate, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { stageId, temperatura, valorPotencial } = req.body;

    // Get first stage if not provided
    let targetStageId = stageId;
    if (!targetStageId) {
      const firstStage = await prisma.pipelineStage.findFirst({
        where: { imobiliariaId: req.user.imobiliariaId },
        orderBy: { ordem: 'asc' }
      });
      if (!firstStage) {
        return res.status(400).json({ error: 'Nenhum estágio configurado. Crie estágios primeiro.' });
      }
      targetStageId = firstStage.id;
    }

    const pipelineLead = await prisma.leadPipeline.create({
      data: {
        leadId: parseInt(leadId),
        stageId: parseInt(targetStageId),
        temperatura: temperatura || 'morno',
        valorPotencial: valorPotencial ? parseFloat(valorPotencial) : null
      },
      include: { lead: true, stage: true }
    });

    res.status(201).json(pipelineLead);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Lead já está no pipeline' });
    }
    console.error('Erro ao adicionar lead ao pipeline:', error);
    res.status(500).json({ error: 'Erro ao adicionar lead ao pipeline' });
  }
});

module.exports = router;
