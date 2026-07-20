import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Worker, Queue } from 'bullmq';
import { URL } from 'url';
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

const INACTIVITY_DAYS = parseInt(process.env.LEAD_INACTIVITY_DAYS || '14', 10);

const leadDecayQueue = new Queue('leadDecayQueue', { connection: redisConnection });
// Producer queue for automation-triggered outbound messages (same queue leadMessageWorker consumes)
const leadMessageQueue = new Queue('leadMessageQueue', { connection: redisConnection });

// Register the daily repeating scheduler (idempotent — safe to call on every boot)
await leadDecayQueue.upsertJobScheduler(
  'daily-lead-decay',
  { every: 24 * 60 * 60 * 1000 },
  { name: 'run-lead-decay', data: {} },
);

export const leadDecayWorker = new Worker(
  'leadDecayQueue',
  async (job) => {
    console.log(`Running lead decay job ${job.id}`);
    const cutoff = new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);

    // Identify stale leads before updating so we have their IDs for automation processing
    const staleLeads = await prisma.lead.findMany({
      where: {
        isActive: true,
        optedOut: false,
        OR: [
          { lastInteractionAt: { lt: cutoff } },
          { AND: [{ lastInteractionAt: null }, { createdAt: { lt: cutoff } }] },
        ],
      },
      select: { id: true, companyId: true, email: true, phone: true, name: true },
    });

    if (staleLeads.length === 0) {
      console.log('Lead decay: no stale leads found.');
      return;
    }

    // Mark them inactive
    const staleIds = staleLeads.map((l: any) => l.id);
    await prisma.lead.updateMany({
      where: { id: { in: staleIds }, deletedAt: null },
      data: { isActive: false, updatedAt: new Date() },
    });
    console.log(`Lead decay: marked ${staleLeads.length} lead(s) inactive (cutoff: ${INACTIVITY_DAYS} days).`);

    // Group by companyId to batch automation lookups
    const byCompany = new Map<number, typeof staleLeads>();
    for (const lead of staleLeads) {
      const arr = byCompany.get(lead.companyId) ?? [];
      arr.push(lead);
      byCompany.set(lead.companyId, arr);
    }

    const fromEmail = process.env.LEAD_FROM_EMAIL || 'onboarding@resend.dev';
    const fromPhone = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || '+14155238886';

    for (const [companyId, leads] of byCompany.entries()) {
      const automations = await (prisma as any).automation.findMany({
        where: { companyId, trigger: 'LEAD_INACTIVE', enabled: true },
      });

      if (automations.length === 0) continue;

      for (const automation of automations) {
        const config = automation.actionConfig as { channel: string; template: string };
        const channelUpper = config.channel.toUpperCase();

        for (const lead of leads) {
          if (channelUpper === 'EMAIL' && !lead.email) continue;
          if ((channelUpper === 'SMS' || channelUpper === 'WHATSAPP') && !lead.phone) continue;

          const to = channelUpper === 'EMAIL' ? lead.email! : lead.phone!;
          const from = channelUpper === 'EMAIL' ? fromEmail : fromPhone;
          const channelLower = channelUpper === 'EMAIL' ? 'email' : channelUpper === 'SMS' ? 'sms' : 'whatsapp';

          try {
            const msg = await prisma.message.create({
              data: {
                companyId,
                leadId: lead.id,
                direction: 'outbound',
                channel: channelLower as any,
                sender: from,
                recipient: to,
                body: config.template,
                status: 'QUEUED',
              },
            });

            await leadMessageQueue.add('send-lead-message', {
              messageId: msg.id,
              leadId: lead.id,
              companyId,
              userId: 0,
              channel: channelUpper,
              to,
              from,
              body: config.template,
            });

            console.log(`Automation ${automation.id}: queued message to lead ${lead.id} via ${channelUpper}.`);
          } catch (err) {
            console.error(`Automation ${automation.id}: failed for lead ${lead.id}:`, err);
          }
        }
      }
    }
  },
  { connection: redisConnection },
);

leadDecayWorker.on('completed', (job) => console.log(`leadDecayWorker job ${job.id} completed.`));
leadDecayWorker.on('failed', (job, err) => console.error(`leadDecayWorker job ${job?.id} failed: ${err.message}`));
