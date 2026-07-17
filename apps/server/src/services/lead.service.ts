import { prisma } from "@repo/db";
import type { LeadStatus, LeadPriority, LeadChannel } from "@repo/db";
import { Queue } from "bullmq";
import { redisConnection } from "../utils/redis.service.js";
import type { CreateLeadData, UpdateLeadData, SendLeadMessageData } from "../types/lead.types.js";

export const leadMessageQueue = new Queue("leadMessageQueue", {
  connection: redisConnection,
});

// Maps LeadChannel → MessageChannel (Prisma enum values)
const LEAD_CHANNEL_TO_MESSAGE: Record<LeadChannel, string> = {
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  OTHER: "email",
};

class LeadService {
  async createLead(companyId: number, requesterId: number, data: CreateLeadData): Promise<any> {
    const lead = await prisma.lead.create({
      data: {
        companyId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        status: data.status ?? "no_reply",
        priority: data.priority ?? "low",
        score: data.score ?? 0,
        notes: data.notes ?? null,
        source: data.source ?? null,
        clientId: data.clientId ?? null,
        ownerId: data.ownerId ?? requesterId,
        originChannel: data.originChannel ?? null,
        isActive: true,
        optedOut: false,
      },
      include: { owner: { select: { id: true, name: true, email: true } }, client: { select: { id: true, name: true, accountId: true } } },
    });
    return lead;
  }

  async listLeads(
    companyId: number,
    opts: {
      clientId?: number;
      status?: LeadStatus;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (opts.clientId !== undefined) where.clientId = opts.clientId;
    if (opts.status !== undefined) where.status = opts.status;
    if (opts.isActive !== undefined) where.isActive = opts.isActive;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, accountId: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return { leads, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getLead(companyId: number, id: number): Promise<any> {
    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, accountId: true } },
      },
    });
    return lead;
  }

  async updateLead(companyId: number, id: number, data: UpdateLeadData): Promise<any> {
    const existing = await prisma.lead.findFirst({ where: { id, companyId } });
    if (!existing) return null;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.score !== undefined && { score: data.score }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.clientId !== undefined && { clientId: data.clientId }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.optedOut !== undefined && { optedOut: data.optedOut }),
        ...(data.lastChannel !== undefined && { lastChannel: data.lastChannel }),
      } as any,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, accountId: true } },
      },
    });
    return lead;
  }

  async deleteLead(companyId: number, id: number): Promise<boolean> {
    const existing = await prisma.lead.findFirst({ where: { id, companyId } });
    if (!existing) return false;
    await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  }

  async getLeadMessages(companyId: number, leadId: number): Promise<any> {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId } });
    if (!lead) return null;

    const messages = await prisma.message.findMany({
      where: { leadId, companyId },
      orderBy: { createdAt: "asc" },
    });
    return messages;
  }

  async queueLeadMessage(
    companyId: number,
    leadId: number,
    userId: number,
    data: SendLeadMessageData,
  ): Promise<any> {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId } });
    if (!lead) return null;

    // Determine to/from based on channel
    let to = "";
    let from = "";
    if (data.channel === "EMAIL") {
      if (!lead.email) throw new Error("Lead has no email address.");
      to = lead.email;
      from = process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev";
    } else if (data.channel === "SMS" || data.channel === "WHATSAPP") {
      if (!lead.phone) throw new Error("Lead has no phone number.");
      to = lead.phone;
      from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || "+14155238886";
    } else {
      throw new Error("Unsupported channel.");
    }

    // Create message row immediately with QUEUED status
    const message = await prisma.message.create({
      data: {
        companyId,
        leadId,
        direction: "outbound",
        channel: LEAD_CHANNEL_TO_MESSAGE[data.channel] as any,
        sender: from,
        recipient: to,
        subject: data.subject ?? null,
        body: data.body,
        status: "QUEUED",
      },
    });

    // Update lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { lastInteractionAt: new Date(), lastChannel: data.channel, lastContactedAt: new Date() },
    });

    // Enqueue the actual send job
    await leadMessageQueue.add("send-lead-message", {
      messageId: message.id,
      leadId,
      companyId,
      userId,
      channel: data.channel,
      to,
      from,
      subject: data.subject,
      body: data.body,
    });

    return message;
  }
}

export const leadService = new LeadService();
