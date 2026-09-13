import { Worker, Job } from 'bullmq';
import { config } from '../config.js';
import { prisma } from '../config/clients.js';
import { emailQueue, EMAIL_QUEUE } from '../queues/emailQueue.js';
import { checkLimit } from '../services/rateLimiter.js';
import { notifySlack } from '../services/slack.js';
import { getTransporter } from '../services/mailer.js';
import { indexEmail } from '../services/elasticsearch.js';
import { log } from '../utils/logger.js';

export const worker = new Worker(
  EMAIL_QUEUE,
  async (job: Job) => {
    const id = String(job.data.emailJobId);

    // 1. Fetch email job details from database
    const email = await prisma.emailJob.findUnique({
      where: { id },
      include: {
        user: true,
        sender: true,
      },
    });

    // 2. Guard clause: Skip if job does not exist or was already processed
    if (!email || email.status === 'SENT' || email.status === 'FAILED') {
      return;
    }

    // 3. Check rate limiting threshold
    const rate = await checkLimit(email.senderId, email.sender.hourlyLimit);

    if (!rate.allowed) {
      const when = new Date(Date.now() + rate.delay);

      // Update job status to RATE_LIMITED
      const limited = await prisma.emailJob.update({
        where: { id },
        data: { status: 'RATE_LIMITED' },
      });

      await indexEmail(limited);

      // Trigger Slack alert webhook
      await notifySlack(
        email.user,
        email.sender.email,
        email.sender.hourlyLimit,
        when
      );

      // Re-queue the job with delay for the next window
      await emailQueue.add(
        'send-email',
        { emailJobId: id },
        {
          delay: rate.delay,
          jobId: `rescheduled-${id}-${when.getTime()}`,
        }
      );

      return;
    }

    // 4. Enforce minimum dispatch delay if configured
    if (config.minDelay > 0) {
      await new Promise((r) => setTimeout(r, config.minDelay));
    }

    // Mark job as PROCESSING
    await prisma.emailJob.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });

    // 5. Send email via Nodemailer
    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail({
        from: `${email.user.name} <${email.sender.email}>`,
        to: email.recipientEmail,
        subject: email.subject,
        text: email.body,
        html: `<p>${email.body.replace(/\n/g, '<br/>')}</p>`,
      });

      // Update job status to SENT
      const updated = await prisma.emailJob.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      await indexEmail(updated);
      log.info(`Sent ${id} to ${email.recipientEmail}`, info.messageId);
    } catch (e: any) {
      // Handle send failure
      const failed = await prisma.emailJob.update({
        where: { id },
        data: {
          status: 'FAILED',
          retryCount: { increment: 1 },
          errorMessage: e?.message || 'SMTP failure',
        },
      });

      await indexEmail(failed);
      throw e;
    }
  },
  {
    connection: config.redis,
    concurrency: config.concurrency,
  }
);

// Worker failure event listener
worker.on('failed', (job, err) =>
  log.error('Worker job failed', job?.id, err)
);