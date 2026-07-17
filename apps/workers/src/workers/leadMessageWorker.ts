import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { URL } from 'url';
import twilio from 'twilio';
import { Resend } from 'resend';
import { prisma } from '@repo/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../env/root.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../env/worker.env') });

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const parsedUrl = new URL(redisUrl);
const redisConnection = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || '6379'),
  password: parsedUrl.password || undefined,
  maxRetriesPerRequest: null,
};

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const hasValidTwilio = Boolean(accountSid && authToken && !accountSid.includes('your_') && !authToken.includes('your_'));

let twilioClient: twilio.Twilio | null = null;
if (hasValidTwilio) {
  try { twilioClient = twilio(accountSid, authToken); } catch { twilioClient = null; }
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');

export const leadMessageWorker = new Worker(
  'leadMessageQueue',
  async (job) => {
    const { messageId, leadId, companyId, channel, to, from, subject, body } = job.data;
    console.log(`Processing leadMessageQueue job ${job.id} — lead ${leadId}, channel ${channel}`);

    let externalId: string | null = null;
    let status: 'SENT' | 'FAILED' = 'SENT';

    try {
      if (channel === 'EMAIL') {
        const response = await resend.emails.send({
          from: process.env.LEAD_FROM_EMAIL || 'onboarding@resend.dev',
          to,
          subject: subject || 'Message from CRM',
          html: `<p>${body}</p>`,
        });
        externalId = response.data?.id ?? null;
      } else if (channel === 'SMS') {
        if (!twilioClient) throw new Error('Twilio not configured.');
        const result = await twilioClient.messages.create({ from, to, body });
        externalId = result.sid;
      } else if (channel === 'WHATSAPP') {
        if (!twilioClient) throw new Error('Twilio not configured.');
        const result = await twilioClient.messages.create({
          from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
          to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
          body,
        });
        externalId = result.sid;
      }
    } catch (sendErr: any) {
      console.error(`Failed to send lead message:`, sendErr);
      status = 'FAILED';
    }

    // Update the pre-created message row
    await prisma.$transaction([
      prisma.message.update({
        where: { id: messageId },
        data: { status, ...(externalId !== null && { externalId }) },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: { lastInteractionAt: new Date() },
      }),
    ]);

    if (status === 'FAILED') throw new Error('Message send failed — see logs.');
  },
  { connection: redisConnection },
);

leadMessageWorker.on('completed', (job) => console.log(`leadMessageWorker job ${job.id} completed.`));
leadMessageWorker.on('failed', (job, err) => console.error(`leadMessageWorker job ${job?.id} failed: ${err.message}`));
