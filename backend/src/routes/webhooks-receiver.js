const express = require('express');
const router = express.Router();
const { processInboundMessage } = require('../services/whatsapp.service');

// POST /webhooks/evolution - Receive inbound messages from Evolution API
router.post('/evolution', async (req, res) => {
  try {
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
