import { Router } from 'express';
import { prisma } from '../config/clients.js';

const r = Router();

r.post('/connect-webhook', async (req, res) => {
  try {
    const { userId, webhookUrl } = req.body;

    if (!userId || !webhookUrl) {
      return res
        .status(400)
        .json({ error: 'userId and webhookUrl are required' });
    }

    // Validate URL structure
    new URL(webhookUrl);

    await prisma.user.update({
      where: { id: userId },
      data: { slackWebhookUrl: webhookUrl },
    });

    res.json({ message: 'Slack webhook connected' });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Could not connect Slack' });
  }
});

export default r;