import type { Request, Response } from 'express';
import { prisma } from '@repo/db';
import { Queue } from 'bullmq';

const inboundEmailQueue = new Queue('inboundEmailQueue', { connection: { host: '127.0.0.1', port: 6379 } });

export const handleIncomingWhatsApp = async (req: Request, res: Response) => {
  try {
    const { From, To, Body } = req.body;

    // Find integration
    const integration = await prisma.integration.findUnique({
      where: { identity: To }
    });

    if (!integration) {
      console.error(`No integration found for identity: ${To}`);
      return res.status(200).send('<Response></Response>');
    }

    // Find open ticket or create a new one
    let ticket = await prisma.ticket.findFirst({
      where: {
        companyId: integration.companyId,
        customerNum: From,
        status: 'open'
      }
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          companyId: integration.companyId,
          customerNum: From,
          status: 'open'
        }
      });
    }

    // Save message
    await prisma.message.create({
      data: {
        companyId: integration.companyId,
        ticketId: ticket.id,
        direction: 'inbound',
        channel: 'whatsapp',
        sender: From,
        recipient: To,
        body: Body || ''
      }
    });

    return res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    return res.status(200).send('<Response></Response>'); // Twilio standard expects 200
  }
};

export const handleIncomingEmail = async (req: Request, res: Response) => {
  try {
    // Webhook from Resend. The DB logic is handled in the worker.
    await inboundEmailQueue.add('process-inbound-email', req.body);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling inbound email webhook:', error);
    return res.status(500).json({ error: 'Failed to process email' });
  }
};
