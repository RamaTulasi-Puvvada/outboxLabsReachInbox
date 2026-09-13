import axios from 'axios';
import type { EmailJob, SchedulePayload, User } from '../types';

export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function googleLogin(idToken: string) {
  const { data } = await api.post<{ user: User }>('/api/auth/google', {
    idToken,
  });
  return data.user;
}

export async function demoLogin(email: string, name: string) {
  const { data } = await api.post<{ user: User }>('/api/auth/demo', {
    email,
    name,
  });
  return data.user;
}

export async function getScheduled(userId: string, q = '') {
  const { data } = await api.get<EmailJob[]>('/api/emails/scheduled', {
    params: { userId, q },
  });
  return data;
}

export async function getSent(userId: string, q = '') {
  const { data } = await api.get<EmailJob[]>('/api/emails/sent', {
    params: { userId, q },
  });
  return data;
}

export async function getEmail(id: string, userId: string) {
  const { data } = await api.get<EmailJob>(`/api/emails/${id}`, {
    params: { userId },
  });
  return data;
}

export async function scheduleEmails(payload: SchedulePayload) {
  const { data } = await api.post('/api/emails/schedule', payload);
  return data;
}

export async function connectSlack(userId: string, webhookUrl: string) {
  return api.post('/api/slack/connect-webhook', { userId, webhookUrl });
}