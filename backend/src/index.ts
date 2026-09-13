import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { config } from './config.js';
import { emailQueue } from './queues/emailQueue.js';
import { initElastic } from './services/elasticsearch.js';
import auth from './routes/auth.js';
import emails from './routes/emails.js';
import slack from './routes/slack.js';
import './workers/emailWorker.js';
import { log } from './utils/logger.js';

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: '2mb' }));

const adapter = new ExpressAdapter();
adapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: adapter,
});

app.use('/admin/queues', adapter.getRouter());
app.use('/api/auth', auth);
app.use('/api/emails', emails);
app.use('/api/slack', slack);

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(config.port, async () => {
  await initElastic();
  log.info(`Backend http://localhost:${config.port}`);
  log.info(`Bull Board http://localhost:${config.port}/admin/queues`);
});