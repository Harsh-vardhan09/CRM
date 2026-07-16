import type { Request, Response } from 'express';
import { prisma } from '@repo/db';
import { Queue } from 'bullmq';
import { redisConnection } from '../utils/redis.service.js';

const inboundEmailQueue = new Queue('inboundEmailQueue', { connection: redisConnection });

export const handleIncomingWhatsApp = async (req: Request, res: Response) => {
  try {
    const { From, To, Body } = req.body;
    
    // Twilio prepends 'whatsapp:' to phone numbers. Strip it to match our DB identity.
    const normalizedTo = To ? To.replace('whatsapp:', '') : '';
    const normalizedFrom = From ? From.replace('whatsapp:', '') : '';

    // Find integration
    let integration = await prisma.integration.findUnique({
      where: { identity: normalizedTo }
    });

    if (!integration && normalizedTo === '+14155238886') {
      const firstCompany = await prisma.company.findFirst();
      if (firstCompany) {
        integration = await prisma.integration.create({
          data: { companyId: firstCompany.id, provider: 'twilio', identity: normalizedTo, config: {} }
        });
      }
    }

    if (!integration) {
      console.error(`No integration found for identity: ${To}`);
      return res.status(200).send('<Response></Response>');
    }

    // Find open ticket or create a new one
    let ticket = await prisma.ticket.findFirst({
      where: {
        companyId: integration.companyId,
        customerNum: normalizedFrom,
        status: 'open'
      }
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          companyId: integration.companyId,
          customerNum: normalizedFrom,
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
        sender: normalizedFrom,
        recipient: normalizedTo,
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
