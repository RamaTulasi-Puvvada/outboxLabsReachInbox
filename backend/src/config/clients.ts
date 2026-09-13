import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import { config } from '../config.js';

export const prisma = new PrismaClient();

// Get REDIS_URL from environment or config
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  // Enable TLS for Upstash or rediss:// URLs
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  family: 4,
});

export const elastic = new ElasticClient({
  node: config.elasticsearchNode,
});