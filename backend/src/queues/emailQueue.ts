import { Queue } from 'bullmq';
import { redis } from '../config/clients.js';
export const EMAIL_QUEUE = 'email-dispatch-queue';

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: redis, // Re-use the existing TLS-enabled ioredis instance
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});