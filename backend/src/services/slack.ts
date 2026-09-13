import axios from 'axios';
import { WebClient } from '@slack/web-api';
import { log } from '../utils/logger.js';

export async function notifySlack(
  user: any,
  sender: string,
  limit: number,
  rescheduled: Date
) {
  const text = `🚨 ReachInbox rate limit triggered\nSender: ${sender}\nHourly limit: ${limit}\nJob rescheduled for: ${rescheduled.toISOString()}`;

  // Fallback to process.env if user has no webhook saved in DB
  const webhookUrl = user?.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;

  try {
    if (webhookUrl) {
      await axios.post(webhookUrl, { text });
      log.info(`[Slack Alert] Sent to webhook for ${sender}`);
      return;
    }

    if (user?.slackAccessToken && user?.slackChannel) {
      await new WebClient(user.slackAccessToken).chat.postMessage({
        channel: user.slackChannel,
        text,
      });
      log.info(`[Slack Alert] Sent via OAuth to channel ${user.slackChannel}`);
      return;
    }

    log.warn('[Slack Alert] No webhook URL or Slack tokens found for user/env.');
  } catch (e) {
    log.warn('Slack notification failed', e);
  }
}