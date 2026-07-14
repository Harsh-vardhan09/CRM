import { Worker } from 'bullmq';
import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    connection: {
      host: '127.0.0.1',
      port: 6379
    }
  }
);

outboundEmailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

outboundEmailWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});
