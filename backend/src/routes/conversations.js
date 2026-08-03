const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');
const { emitToUser } = require('../socket');

// GET /conversations - Listar conversas
router.get('/', authenticate, async (req, res) => {
  try {
    if (!req.user.imobiliariaId) return res.json([]);

    const { canal, status, assignedToId } = req.query;
    const where = { imobiliariaId: req.user.imobiliariaId };

    if (canal) where.canal = canal;
    if (status) where.status = status;

    // Role filtering
    if (req.user.role === 'corretor') {
      where.assignedToId = req.user.id;
    } else if (assignedToId) {
      where.assignedToId = parseInt(assignedToId);
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        lead: { select: { id: true, nome: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true, direction: true } }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50
    });

    res.json(conversations);
  } catch (error) {
    console.error('Erro conversations:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

// GET /conversations/:id/messages - Mensagens de uma conversa
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: parseInt(req.params.id) },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// POST /conversations/:id/messages - Enviar mensagem
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { content, contentType } = req.body;
    if (!content) return res.status(400).json({ error: 'Conteúdo é obrigatório' });

    const message = await prisma.message.create({
      data: {
        conversationId: parseInt(req.params.id),
        direction: 'outbound',
        content,
        contentType: contentType || 'text',
        senderName: req.user.name,
        status: 'sent'
      }
    });

    // Update lastMessageAt
    await prisma.conversation.update({
      where: { id: parseInt(req.params.id) },
      data: { lastMessageAt: new Date() }
    });

    // TODO: Send via WhatsApp/Evolution API if canal === 'whatsapp'

    res.status(201).json(message);
  } catch (error) {
    console.error('Erro enviar msg:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// PUT /conversations/:id/assign - Transferir conversa
router.put('/:id/assign', authenticate, async (req, res) => {
  try {
    const { assignedToId } = req.body;
    const conversation = await prisma.conversation.update({
      where: { id: parseInt(req.params.id) },
      data: { assignedToId: parseInt(assignedToId) }
    });

    // Notify the new assigned user
    emitToUser(assignedToId, 'notification:new', {
      tipo: 'nova_mensagem',
      titulo: 'Conversa transferida',
      mensagem: `Uma conversa de ${conversation.contactName} foi transferida para você`
    });

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao transferir conversa' });
  }
});

// PUT /conversations/:id/status - Alterar status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const conversation = await prisma.conversation.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// POST /conversations - Criar conversa manualmente
router.post('/', authenticate, async (req, res) => {
  try {
    const { contactName, contactPhone, contactEmail, canal, leadId } = req.body;
    if (!contactName || !canal) return res.status(400).json({ error: 'Nome e canal são obrigatórios' });

    const conversation = await prisma.conversation.create({
      data: {
        contactName,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        canal,
        leadId: leadId ? parseInt(leadId) : null,
        assignedToId: req.user.id,
        imobiliariaId: req.user.imobiliariaId
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Erro criar conversa:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
});

module.exports = router;
