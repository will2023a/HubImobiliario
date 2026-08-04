const express = require('express');
const router = express.Router();
const { processInboundMessage } = require('../services/whatsapp.service');
const crypto = require('crypto');

// POST /webhooks/evolution - Receive inbound messages from Evolution API
router.post('/evolution', async (req, res) => {
  try {
    const expected = process.env.EVOLUTION_WEBHOOK_SECRET;
    const supplied = req.get('x-webhook-secret') || '';
    if (!expected || supplied.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      return res.status(401).json({ error: 'Webhook não autorizado' });
    }
    const { event, data, instance } = req.body;

    // Only process message events
    if (event === 'messages.upsert') {
      await processInboundMessage({ instance, data: data?.[0] || data });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ received: true }); // Always return 200 to avoid retries
  }
});

module.exports = router;
