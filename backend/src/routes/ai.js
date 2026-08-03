const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');
const { generateSuggestion, qualifyLead, summarizeConversation, searchNLP } = require('../services/ai.service');

// POST /ai/suggest - Gerar sugestões de resposta para o inbox
router.post('/suggest', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'conversationId obrigatório' });

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) },
      include: { lead: true }
    });

    const leadInfo = conversation?.lead
      ? `Nome: ${conversation.lead.nome}, Origem: ${conversation.lead.origem}, Status: ${conversation.lead.status}`
      : null;

    const result = await generateSuggestion(messages.reverse(), leadInfo);
    res.json(result);
  } catch (error) {
    console.error('Erro AI suggest:', error);
    res.status(500).json({ error: 'Erro ao gerar sugestões' });
  }
});

// POST /ai/qualify - Qualificar lead
router.post('/qualify', authenticate, async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'leadId obrigatório' });

    const lead = await prisma.lead.findUnique({ where: { id: parseInt(leadId) } });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    // Get conversation history
    const conversations = await prisma.conversation.findMany({
      where: { leadId: parseInt(leadId) },
      include: { messages: { take: 20, orderBy: { createdAt: 'desc' } } }
    });

    const allMessages = conversations.flatMap(c => c.messages).reverse();
    const result = await qualifyLead(lead, allMessages);

    // Update lead temperature
    if (result.temperatura) {
      await prisma.lead.update({
        where: { id: parseInt(leadId) },
        data: { temperatura: result.temperatura }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Erro AI qualify:', error);
    res.status(500).json({ error: 'Erro ao qualificar lead' });
  }
});

// POST /ai/summarize - Resumir conversa
router.post('/summarize', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'conversationId obrigatório' });

    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(conversationId) },
      orderBy: { createdAt: 'asc' },
      take: 30
    });

    const summary = await summarizeConversation(messages);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resumir' });
  }
});

// POST /ai/search - Busca com IA (linguagem natural)
router.post('/search', authenticate, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query obrigatória' });

    const result = await searchNLP(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro na busca IA' });
  }
});

module.exports = router;
