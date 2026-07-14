import { Worker } from 'bullmq';
import { prisma } from '@repo/db';
import 'dotenv/config';

export const inboundEmailWorker = new Worker(
  'inboundEmailQueue',
  async (job) => {
    console.log(`Processing inbound email job ${job.id}`);
    try {
      const { from, to, text, html, subject } = job.data;
      
      const sender = from || 'unknown@email.com';
      const recipient = to || 'unknown@yourdomain.com';
      const body = text || html || 'Empty message body';

      // Default to companyId 1
      const companyId = 1;

      // Find open ticket or create a new one
      let ticket = await prisma.ticket.findFirst({
        where: {
          companyId: companyId,
          customerNum: sender,
          status: 'open'
        }
      });

      if (!ticket) {
        ticket = await prisma.ticket.create({
          data: {
            companyId: companyId,
            customerNum: sender,
            status: 'open'
          }
        });
      }

      // Save message
      await prisma.message.create({
        data: {
          companyId: companyId,
          ticketId: ticket.id,
          direction: 'inbound',
          channel: 'email',
          sender: sender,
          recipient: recipient,
          subject: subject,
          body: body
        }
      });
      
      console.log(`Inbound email processed successfully for ticket ${ticket.id}`);
    } catch (error) {
      console.error(`Failed to process inbound email:`, error);
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

inboundEmailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

inboundEmailWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});
