const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../prisma/client');

/**
 * Dispatch event to all registered webhooks for an imobiliaria
 */
async function dispatchWebhook(imobiliariaId, evento, payload) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { imobiliariaId, ativo: true }
    });

    for (const webhook of webhooks) {
      // Check if webhook is subscribed to this event
      const eventos = Array.isArray(webhook.eventos) ? webhook.eventos : [];
      if (!eventos.includes(evento) && !eventos.includes('*')) continue;

      // Generate signature
      const signature = crypto
        .createHmac('sha256', webhook.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Send webhook
      let statusCode = null;
      let response = null;
      let sucesso = false;

      try {
        const res = await axios.post(webhook.url, {
          evento,
          payload,
          timestamp: new Date().toISOString()
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': evento
          },
          timeout: 10000
        });
        statusCode = res.status;
        response = JSON.stringify(res.data).slice(0, 500);
        sucesso = res.status >= 200 && res.status < 300;
      } catch (err) {
        statusCode = err.response?.status || 0;
        response = err.message;
        sucesso = false;
      }

      // Log delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          evento,
          payload,
          statusCode,
          response,
          sucesso
        }
      });
    }
  } catch (error) {
    console.error('Erro dispatch webhook:', error.message);
  }
}

module.exports = { dispatchWebhook };
