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

  try {
    if (user.slackWebhookUrl) {
      await axios.post(user.slackWebhookUrl, { text });
      return;
    }

    if (user.slackAccessToken && user.slackChannel) {
      await new WebClient(user.slackAccessToken).chat.postMessage({
        channel: user.slackChannel,
        text,
      });
    }
  } catch (e) {
    log.warn('Slack notification failed', e);
  }
}