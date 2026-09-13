import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  db: process.env.DATABASE_URL!,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
  },
  elasticsearchNode:
    process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  minDelay: Number(process.env.MIN_DELAY_BETWEEN_EMAILS_MS || 2000),
  defaultHourlyLimit: Number(process.env.MAX_EMAILS_PER_HOUR || 200),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  slackClientId: process.env.SLACK_CLIENT_ID || '',
  slackClientSecret: process.env.SLACK_CLIENT_SECRET || '',
  slackRedirectUri:
    process.env.SLACK_REDIRECT_URI ||
    'http://localhost:5000/api/slack/callback',
};