import nodemailer from 'nodemailer';
import { log } from '../utils/logger.js';

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter() {
  if (!transporter) {
    const account = await nodemailer.createTestAccount();
    log.info('Ethereal test account created:', account.user);

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  }

  return transporter;
}

export function previewUrl(info: any) {
  return nodemailer.getTestMessageUrl(info) || null;
}