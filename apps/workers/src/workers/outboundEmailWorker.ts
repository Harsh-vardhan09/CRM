import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { Resend } from 'resend';
import { URL } from 'url';

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

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');

export const outboundEmailWorker = new Worker(
  'outboundEmailQueue',
  async (job) => {
    console.log(`Processing outbound email job ${job.id} for ticket ${job.data.ticketId}`);
    try {
      const { to, subject, body } = job.data;
      
      const response = await resend.emails.send({
        from: 'onboarding@resend.dev', // Required when testing without a verified domain
        to,
        subject: subject || 'Support Ticket Update',
        html: `<p>${body}</p>`
      });
      
      console.log(`Email sent successfully: ${response.data?.id}`);
    } catch (error) {
      console.error(`Failed to send outbound email:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection
  }
);

outboundEmailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

outboundEmailWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});
