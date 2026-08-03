const axios = require('axios');
const prisma = require('../prisma/client');
const { emitToUser, emitToImobiliaria } = require('../socket');

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || '';

/**
 * Send a WhatsApp message via Evolution API
 */
async function sendMessage(instanceName, phone, message) {
  try {
    const response = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${instanceName}`,
      {
        number: phone,
        text: message
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_KEY
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Process inbound webhook from Evolution API
 */
async function processInboundMessage(payload) {
  try {
    const { instance, data } = payload;
    if (!data?.message?.conversation && !data?.message?.extendedTextMessage) return;

    const phone = data.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const content = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
    const senderName = data.pushName || phone;

    if (!phone || !content) return;

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { contactPhone: phone, canal: 'whatsapp' }
    });

    if (!conversation) {
      // Try to find a lead by phone
      const lead = await prisma.lead.findFirst({ where: { telefone: { contains: phone.slice(-8) } } });

      conversation = await prisma.conversation.create({
        data: {
          canal: 'whatsapp',
          contactName: senderName,
          contactPhone: phone,
          leadId: lead?.id || null,
          imobiliariaId: lead?.imobiliariaId || 1, // fallback
          status: 'aberta'
        }
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        content,
        contentType: 'text',
        senderName,
        status: 'delivered'
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: 'aberta' }
    });

    // Emit real-time update
    if (conversation.assignedToId) {
      emitToUser(conversation.assignedToId, 'conversation:message', {
        conversationId: conversation.id,
        message
      });
    }
    if (conversation.imobiliariaId) {
      emitToImobiliaria(conversation.imobiliariaId, 'conversation:message', {
        conversationId: conversation.id,
        message
      });
    }

    return { conversation, message };
  } catch (error) {
    console.error('Erro processando mensagem inbound:', error);
    return null;
  }
}

/**
 * Get QR Code for instance connection
 */
async function getQRCode(instanceName) {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/connect/${instanceName}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Check instance connection status
 */
async function getConnectionStatus(instanceName) {
  try {
    const response = await axios.get(
      `${EVOLUTION_URL}/instance/connectionState/${instanceName}`,
      { headers: { 'apikey': EVOLUTION_KEY } }
    );
    return response.data;
  } catch (error) {
    return { state: 'disconnected', error: error.message };
  }
}

module.exports = {
  sendMessage,
  processInboundMessage,
  getQRCode,
  getConnectionStatus
};
