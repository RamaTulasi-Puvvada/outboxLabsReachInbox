import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import { config } from '../config.js';

export const prisma = new PrismaClient();

export const redis = new Redis({
  ...config.redis,
  maxRetriesPerRequest: null,
});

export const elastic = new ElasticClient({
  node: config.elasticsearchNode,
});