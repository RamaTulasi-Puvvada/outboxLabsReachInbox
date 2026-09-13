import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/clients.js';
import { config } from '../config.js';
import crypto from 'node:crypto';

const r = Router();

async function ensureSender(userId: string, email: string) {
  const existing = await prisma.sender.findFirst({ where: { userId } });
  if (existing) return existing;

  return prisma.sender.create({
    data: {
      userId,
      email,
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      smtpUser: 'runtime',
      smtpPass: 'runtime',
      hourlyLimit: config.defaultHourlyLimit,
    },
  });
}

r.post('/google', async (req, res) => {
  try {
    if (!config.googleClientId) {
      return res.status(503).json({
        error:
          'Google OAuth is not configured. Add GOOGLE_CLIENT_ID to backend/.env.',
      });
    }

    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const ticket = await new OAuth2Client(
      config.googleClientId
    ).verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });

    const p = ticket.getPayload();
    if (!p?.sub || !p.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    let user = await prisma.user.findUnique({
      where: { googleId: p.sub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: p.sub,
          email: p.email,
          name: p.name || 'User',
          avatar: p.picture,
        },
      });
    }

    await ensureSender(user.id, user.email);
    return res.json({ user });
  } catch (e) {
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

r.post('/demo', async (req, res) => {
  try {
    const email = String(req.body?.email || 'demo@example.com')
      .trim()
      .toLowerCase();
    const name =
      String(req.body?.name || 'Demo User').trim() || 'Demo User';

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    const googleId = `demo:${crypto
      .createHash('sha256')
      .update(email)
      .digest('hex')}`;

    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.create({
        data: { googleId, email, name },
      });
    } else if (user.name !== name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    await ensureSender(user.id, email);
    return res.json({ user });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e.message || 'Demo login failed' });
  }
});

export default r;