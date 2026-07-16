import { prisma } from '@repo/db';

async function main() {
  await prisma.integration.upsert({
    where: { identity: 'whatsapp:+14155238886' },
    update: { companyId: 1 },
    create: {
      companyId: 1,
      provider: 'twilio',
      identity: 'whatsapp:+14155238886',
      config: {},
    }
  });

  await prisma.integration.upsert({
    where: { identity: 'onboarding@resend.dev' },
    update: { companyId: 1 },
    create: {
      companyId: 1,
      provider: 'email_parse',
      identity: 'onboarding@resend.dev',
      config: {},
    }
  });

  console.log('Integrations seeded successfully for Company 1!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
