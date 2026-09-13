import { elastic } from '../config/clients.js';
import { log } from '../utils/logger.js';

const INDEX = 'emails';

export async function initElastic() {
  try {
    const exists = await elastic.indices.exists({ index: INDEX });
    if (!exists) {
      await elastic.indices.create({
        index: INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            senderId: { type: 'keyword' },
            recipientEmail: { type: 'text' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
          },
        },
      });
      log.info('Elasticsearch index created');
    }
  } catch (e) {
    log.warn('Elasticsearch unavailable; search will degrade gracefully', e);
  }
}

export async function indexEmail(job: any) {
  try {
    await elastic.index({
      index: INDEX,
      id: job.id,
      document: {
        id: job.id,
        userId: job.userId,
        senderId: job.senderId,
        recipientEmail: job.recipientEmail,
        subject: job.subject,
        body: job.body,
        status: job.status,
        scheduledAt: job.scheduledAt,
        sentAt: job.sentAt || null,
      },
      refresh: 'wait_for',
    });
  } catch (e) {
    log.warn(`Elasticsearch indexing failed for ${job.id}`, e);
  }
}

export async function searchEmails(
  userId: string,
  q: string,
  status?: string
) {
  try {
    const must: any[] = [{ term: { userId } }];

    if (status) {
      must.push({ term: { status } });
    }

    if (q.trim()) {
      must.push({
        multi_match: {
          query: q,
          fields: ['recipientEmail^3', 'subject^2', 'body'],
          fuzziness: 'AUTO',
        },
      });
    }

    const r = await elastic.search({
      index: INDEX,
      query: { bool: { must } },
      sort: [{ scheduledAt: { order: 'desc' } }],
      size: 200,
    });

    return r.hits.hits.map((h) => h._source);
  } catch (e) {
    log.warn('Elasticsearch search failed', e);
    return [];
  }
}