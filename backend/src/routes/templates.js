const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /templates - Listar templates
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);
    const { categoria, canal } = req.query;
    const where = { imobiliariaId: req.user.imobiliariaId };
    if (categoria) where.categoria = categoria;
    if (canal) where.canal = canal;

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: { categoria: 'asc' }
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

// POST /templates - Criar template
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, categoria, conteudo, canal } = req.body;
    if (!nome || !conteudo) return res.status(400).json({ error: 'Nome e conteúdo são obrigatórios' });

    const template = await prisma.messageTemplate.create({
      data: {
        nome,
        categoria: categoria || 'outro',
        conteudo,
        canal: canal || 'todos',
        imobiliariaId: req.user.imobiliariaId
      }
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// PUT /templates/:id - Atualizar
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nome, categoria, conteudo, canal } = req.body;
    const template = await prisma.messageTemplate.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nome && { nome }),
        ...(categoria && { categoria }),
        ...(conteudo && { conteudo }),
        ...(canal && { canal }),
      }
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// DELETE /templates/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.messageTemplate.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Template removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover template' });
  }
});

// GET /templates/:id/render/:leadId - Renderizar com variáveis do lead
router.get('/:id/render/:leadId', authenticate, async (req, res) => {
  try {
    const template = await prisma.messageTemplate.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!template) return res.status(404).json({ error: 'Template não encontrado' });

    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(req.params.leadId) },
      include: { corretor: { select: { name: true } } }
    });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    let rendered = template.conteudo
      .replace(/\{\{nome_lead\}\}/g, lead.nome || '')
      .replace(/\{\{telefone\}\}/g, lead.telefone || '')
      .replace(/\{\{email\}\}/g, lead.email || '')
      .replace(/\{\{corretor\}\}/g, lead.corretor?.name || '')
      .replace(/\{\{origem\}\}/g, lead.origem || '');

    res.json({ rendered, template: template.nome });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao renderizar template' });
  }
});

module.exports = router;
