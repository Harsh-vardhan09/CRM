import { Worker } from 'bullmq';
import { URL } from 'url';
import twilio from 'twilio';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const parsedUrl = new URL(redisUrl);
const redisConnection = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || '6379'),
  password: parsedUrl.password || undefined,
  maxRetriesPerRequest: null,
};

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let twilioClient: twilio.Twilio | null = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
} else {
  console.warn('Twilio credentials not found in environment variables.');
}

export const whatsappWorker = new Worker(
  'whatsappQueue',
  async (job) => {
    const { to, from, body, messageId } = job.data;
    console.log(`Processing whatsappQueue job ${job.id} for messageId ${messageId}`);

    if (!twilioClient) {
      throw new Error('Twilio client is not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    try {
      const result = await twilioClient.messages.create({
        from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
        to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
        body: body,
      });
      console.log(`Successfully sent message to ${to}. Twilio SID: ${result.sid}`);
      return result;
    } catch (error) {
      console.error(`Failed to send WhatsApp message to ${to}:`, error);
      throw error; // Let BullMQ retry
    }
  },
  { connection: redisConnection }
);

whatsappWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

whatsappWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
