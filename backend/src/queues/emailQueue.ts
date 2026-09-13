import { Queue } from 'bullmq';
import { config } from '../config.js';

export const EMAIL_QUEUE = 'email-dispatch-queue';

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: config.redis,
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