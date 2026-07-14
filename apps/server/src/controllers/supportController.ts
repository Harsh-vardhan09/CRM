import type { Request, Response } from 'express';
import { prisma } from '@repo/db';
import { Queue } from 'bullmq';

const whatsappQueue = new Queue('whatsappQueue', { connection: { host: '127.0.0.1', port: 6379 } });
const outboundEmailQueue = new Queue('outboundEmailQueue', { connection: { host: '127.0.0.1', port: 6379 } });

const dispatchOutboundMessage = async (companyId: number, ticketId: number, customerNum: string, body: string, channel: string, subject?: string) => {
  let senderIdentity = 'onboarding@resend.dev';

  if (channel === 'whatsapp') {
    const integration = await prisma.integration.findFirst({
      where: { companyId, provider: 'twilio' }
    });
    if (!integration) {
      throw new Error('Twilio integration not found for this company');
    }
    senderIdentity = integration.identity;
  } else if (channel === 'email') {
    const integration = await prisma.integration.findFirst({
      where: { companyId, provider: 'email_parse' }
    });
    senderIdentity = integration ? integration.identity : 'onboarding@resend.dev';
  }

  let finalSubject = subject;
  if (!finalSubject && channel === 'email') {
    const lastMsg = await prisma.message.findFirst({
      where: { ticketId, channel: 'email', subject: { not: null } },
      orderBy: { createdAt: 'desc' }
    });
    if (lastMsg && lastMsg.subject) {
      finalSubject = lastMsg.subject.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg.subject}`;
    } else {
      finalSubject = `Re: Support Ticket #${ticketId}`;
    }
  }

  const message = await prisma.message.create({
    data: {
      companyId,
      ticketId,
      direction: 'outbound',
      channel: channel === 'email' ? 'email' : 'whatsapp',
      sender: senderIdentity,
      recipient: customerNum,
      subject: finalSubject || null,
      body
    }
  });

  if (channel === 'email') {
    await outboundEmailQueue.add('send-email', {
      ticketId,
      to: customerNum,
      subject: finalSubject,
      body,
      messageId: message.id
    });
  } else {
    await whatsappQueue.add('send-reply', {
      ticketId,
      to: customerNum,
      from: senderIdentity,
      body,
      messageId: message.id
    });
  }
  return message;
};

export const replyToTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { body, channel = 'whatsapp', subject } = req.body;
    const user = (req as any).user;

    if (!user || !user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(ticketId) }
    });

    if (!ticket || ticket.companyId !== user.companyId) {
      return res.status(404).json({ message: 'Ticket not found or forbidden' });
    }

    const message = await dispatchOutboundMessage(user.companyId, ticket.id, ticket.customerNum, body, channel, subject);
    return res.status(200).json({ success: true, message });
  } catch (error: any) {
    console.error('Error replying to ticket:', error);
    return res.status(error.message?.includes('not found') ? 400 : 500).json({ message: error.message || 'Internal server error' });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { customerNum, body, channel, subject } = req.body;
    const user = (req as any).user;

    if (!user || !user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!customerNum || !body || !channel) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let ticket = await prisma.ticket.findFirst({
      where: { companyId: user.companyId, customerNum, status: 'open' }
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          companyId: user.companyId,
          customerNum,
          status: 'open'
        }
      });
    }

    const message = await dispatchOutboundMessage(user.companyId, ticket.id, ticket.customerNum, body, channel, subject);
    return res.status(200).json({ success: true, ticket, message });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tickets = await prisma.ticket.findMany({
      where: { companyId: user.companyId },
      orderBy: { updatedAt: 'desc' }
    });
    return res.status(200).json(tickets);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getTicketMessages = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const user = (req as any).user;
    
    const messages = await prisma.message.findMany({
      where: { ticketId: Number(ticketId), companyId: user.companyId },
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
