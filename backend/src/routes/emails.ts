import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/clients.js';
import { emailQueue } from '../queues/emailQueue.js';
import { indexEmail, searchEmails } from '../services/elasticsearch.js';

const r = Router();

const schedule = z.object({
  userId: z.string().uuid(),
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1),
  startTime: z.string().datetime({ offset: true }),
  delayBetweenEmailsMs: z
    .number()
    .int()
    .min(0)
    .max(3600000)
    .default(2000),
  hourlyLimit: z.number().int().min(1).max(100000).default(200),
});

function fallbackRows(
  userId: string,
  status: 'scheduled' | 'sent',
  q: string
) {
  return prisma.emailJob.findMany({
    where: {
      userId,
      status:
        status === 'scheduled'
          ? { in: ['PENDING', 'PROCESSING', 'RATE_LIMITED'] }
          : { in: ['SENT', 'FAILED'] },
      ...(q
        ? {
            OR: [
              { recipientEmail: { contains: q, mode: 'insensitive' } },
              { subject: { contains: q, mode: 'insensitive' } },
              { body: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy:
      status === 'scheduled' ? { scheduledAt: 'asc' } : { sentAt: 'desc' },
    take: 200,
  });
}

r.post('/schedule', async (req, res) => {
  try {
    const input = schedule.parse(req.body);

    const sender = await prisma.sender.findFirst({
      where: { userId: input.userId },
    });

    if (!sender) {
      return res.status(404).json({
        error: 'Sender not found. Sign in again to create a sender profile.',
      });
    }

    await prisma.sender.update({
      where: { id: sender.id },
      data: { hourlyLimit: input.hourlyLimit },
    });

    const start = new Date(input.startTime);
    if (start.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ error: 'Start time must be in the future.' });
    }

    const jobs = [];

    for (let i = 0; i < input.recipients.length; i++) {
      const scheduledAt = new Date(
        start.getTime() + i * input.delayBetweenEmailsMs
      );

      const job = await prisma.emailJob.create({
        data: {
          userId: input.userId,
          senderId: sender.id,
          recipientEmail: input.recipients[i].trim().toLowerCase(),
          subject: input.subject,
          body: input.body,
          scheduledAt,
        },
      });

      const bull = await emailQueue.add(
        'send-email',
        { emailJobId: job.id },
        {
          delay: Math.max(0, scheduledAt.getTime() - Date.now()),
          jobId: job.id,
        }
      );

      const updated = await prisma.emailJob.update({
        where: { id: job.id },
        data: { bullJobId: bull.id },
      });

      await indexEmail(updated);
      jobs.push(updated);
    }

    res.status(201).json({ count: jobs.length, jobs });
  } catch (e: any) {
    res.status(400).json({
      error: e?.issues?.[0]?.message || e.message || 'Invalid request',
    });
  }
});

r.get('/scheduled', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    const q = String(req.query.q || '').trim();

    if (q) {
      const found = await searchEmails(userId, q);
      const scheduled = found.filter((x: any) =>
        ['PENDING', 'PROCESSING', 'RATE_LIMITED'].includes(x.status)
      );
      return res.json(scheduled);
    }

    res.json(await fallbackRows(userId, 'scheduled', ''));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

r.get('/sent', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    const q = String(req.query.q || '').trim();

    if (q) {
      const found = await searchEmails(userId, q);
      const sent = found.filter((x: any) =>
        ['SENT', 'FAILED'].includes(x.status)
      );
      if (sent.length) return res.json(sent);
    }

    res.json(await fallbackRows(userId, 'sent', q));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

r.get('/search', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    const q = String(req.query.q ?? req.query.query ?? '');
    const status = req.query.status ? String(req.query.status) : undefined;

    const found = await searchEmails(userId, q, status);

    res.json(
      found.length
        ? found
        : await fallbackRows(
            userId,
            status === 'SENT' || status === 'FAILED' ? 'sent' : 'scheduled',
            q
          )
    );
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

r.get('/:id', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    const row = await prisma.emailJob.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!row) return res.status(404).json({ error: 'Email not found' });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default r;