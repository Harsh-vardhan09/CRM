import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, prisma } from '@repo/db';
import type { Client, AccessLevel } from '@repo/db';
import authRoutes from './routes/authRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const seedDatabase = async () => {
  try {
    // 1. Seed global system Features
    const defaultFeatures = [
      { code: 'leads_management', description: 'Lead Management Interface' },
      { code: 'analytics', description: 'Reporting and Analytics Dashboard' },
      { code: 'automations', description: 'Cron and Workflow Automations' },
      { code: 'settings', description: 'Global System and Organization Settings' },
    ];

    for (const feat of defaultFeatures) {
      await prisma.feature.upsert({
        where: { code: feat.code },
        update: { description: feat.description },
        create: feat,
      });
    }

    const dbFeatures = await prisma.feature.findMany();

    // 2. Seed default Tenant Company
    const companyCount = await prisma.company.count();
    let tenantCompany;
    if (companyCount === 0) {
      console.log('Seeding default Tenant Company...');
      tenantCompany = await prisma.company.create({
        data: {
          name: 'Acme CRM Inc.',
          status: 'active',
        },
      });
    } else {
      tenantCompany = await prisma.company.findFirst();
    }

    if (!tenantCompany) return;

    // 3. Map Features to Tenant Company
    for (const feat of dbFeatures) {
      await prisma.companyFeature.upsert({
        where: {
          companyId_featureId: {
            companyId: tenantCompany.id,
            featureId: feat.id,
          },
        },
        update: {},
        create: {
          companyId: tenantCompany.id,
          featureId: feat.id,
        },
      });
    }

    // 4. Seed Roles for the Tenant Company
    const roles = [
      { name: 'Admin', companyId: tenantCompany.id },
      { name: 'Sales Rep', companyId: tenantCompany.id },
    ];

    for (const roleData of roles) {
      await prisma.role.upsert({
        where: {
          companyId_name: {
            companyId: roleData.companyId,
            name: roleData.name,
          },
        },
        update: {},
        create: roleData,
      });
    }

    const adminRole = await prisma.role.findFirst({
      where: { companyId: tenantCompany.id, name: 'Admin' },
    });
    const salesRole = await prisma.role.findFirst({
      where: { companyId: tenantCompany.id, name: 'Sales Rep' },
    });

    if (!adminRole || !salesRole) return;

    // 5. Map Permissions to Roles
    // Admin gets 'full' on all features
    for (const feat of dbFeatures) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_featureId: {
            roleId: adminRole.id,
            featureId: feat.id,
          },
        },
        update: { accessLevel: 'full' },
        create: {
          roleId: adminRole.id,
          featureId: feat.id,
          accessLevel: 'full',
        },
      });
    }

    // Sales Rep permissions
    const salesPermissions: Array<{ featureCode: string, accessLevel: AccessLevel }> = [
      { featureCode: 'leads_management', accessLevel: 'write' },
      { featureCode: 'analytics', accessLevel: 'read' },
      { featureCode: 'automations', accessLevel: 'read' },
      { featureCode: 'settings', accessLevel: 'read' },
    ];

    for (const sp of salesPermissions) {
      const feat = dbFeatures.find((f: any) => f.code === sp.featureCode);
      if (feat) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_featureId: {
              roleId: salesRole.id,
              featureId: feat.id,
            },
          },
          update: { accessLevel: sp.accessLevel },
          create: {
            roleId: salesRole.id,
            featureId: feat.id,
            accessLevel: sp.accessLevel,
          },
        });
      }
    }

    // 6. Seed Users
    const defaultUsers = [
      {
        email: 'admin@crm.com',
        password: 'admin123',
        name: 'Admin User',
        isOwner: true,
        isSuperAdmin: false,
        roleId: adminRole.id,
        companyId: tenantCompany.id,
      },
      {
        email: 'sales@crm.com',
        password: 'sales123',
        name: 'Sales Representative',
        isOwner: false,
        isSuperAdmin: false,
        roleId: salesRole.id,
        companyId: tenantCompany.id,
      },
      {
        email: 'superadmin@crm.com',
        password: 'super123',
        name: 'Super Admin User',
        isOwner: false,
        isSuperAdmin: true,
        roleId: null,
        companyId: null,
      }
    ];

    for (const cred of defaultUsers) {
      const u = await prisma.user.findUnique({ where: { email: cred.email } });
      if (!u) {
        console.log(`Seeding missing user: ${cred.email}`);
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(cred.password, salt);
        await prisma.user.create({
          data: {
            email: cred.email,
            passwordHash,
            name: cred.name,
            isOwner: cred.isOwner,
            isSuperAdmin: cred.isSuperAdmin,
            roleId: cred.roleId,
            companyId: cred.companyId,
          },
        });
      } else {
        const isCorrect = await bcrypt.compare(cred.password, u.passwordHash);
        if (!isCorrect) {
          console.log(`Fixing corrupted/incorrect password hash for user: ${u.email}`);
          const salt = await bcrypt.genSalt(12);
          const passwordHash = await bcrypt.hash(cred.password, salt);
          await prisma.user.update({
            where: { id: u.id },
            data: { passwordHash },
          });
        }
      }
    }

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@crm.com' } });
    const salesUser = await prisma.user.findUnique({ where: { email: 'sales@crm.com' } });

    // 7. Seed Clients (formerly Companies)
    const clientCount = await prisma.client.count();
    let seededClients: Client[] = [];
    if (clientCount === 0) {
      console.log('Seeding synthetic Clients...');
      const clientsData = [
        {
          name: 'TechCorp Solutions',
          industry: 'Software',
          website: 'https://techcorp.example.com',
          revenue: 12500000.00,
          employeeCount: 450,
          address: 'San Francisco, CA',
          description: 'Enterprise cloud infrastructure provider.',
          companyId: tenantCompany.id,
          ownerId: adminUser?.id ?? null,
        },
        {
          name: 'Apex Retail Group',
          industry: 'Retail',
          website: 'https://apexretail.example.com',
          revenue: 8900000.00,
          employeeCount: 200,
          address: 'New York, NY',
          description: 'Multichannel retail consulting and solutions.',
          companyId: tenantCompany.id,
          ownerId: salesUser?.id ?? null,
        },
        {
          name: 'Nova BioTech',
          industry: 'Healthcare',
          website: 'https://novabiotech.example.com',
          revenue: 45000000.00,
          employeeCount: 1200,
          address: 'Boston, MA',
          description: 'Innovative medical research and development.',
          companyId: tenantCompany.id,
          ownerId: adminUser?.id ?? null,
        },
        {
          name: 'Summit Financials',
          industry: 'Finance',
          website: 'https://summitfin.example.com',
          revenue: 3200000.00,
          employeeCount: 85,
          address: 'Chicago, IL',
          description: 'Wealth management and financial consulting services.',
          companyId: tenantCompany.id,
          ownerId: salesUser?.id ?? null,
        },
        {
          name: 'GreenEnergy Co.',
          industry: 'Energy',
          website: 'https://greenenergy.example.com',
          revenue: 1500000.00,
          employeeCount: 30,
          address: 'Austin, TX',
          description: 'Solar power installation and renewable energy systems.',
          companyId: tenantCompany.id,
          ownerId: salesUser?.id ?? null,
        }
      ];

      for (const cData of clientsData) {
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const finalAccountId = `ACC-${randomStr}${Date.now().toString(36).toUpperCase().slice(-3)}`;
        const c = await prisma.client.create({
          data: {
            ...cData,
            accountId: finalAccountId,
          },
        });
        seededClients.push(c);
      }
    } else {
      seededClients = await prisma.client.findMany();
    }

    // 8. Seed Leads
    const leadCount = await prisma.lead.count();
    if (leadCount === 0) {
      console.log('Seeding synthetic Leads...');
      const leadsData = [
        {
          name: 'Alice Johnson',
          email: 'alice.j@techcorp.example.com',
          phone: '+1-555-0199',
          status: 'qualified' as const,
          score: 85,
          ownerId: salesUser?.id || adminUser!.id,
          companyId: tenantCompany.id,
          clientId: seededClients.find(c => c.name === 'TechCorp Solutions')?.id ?? null,
          notes: 'Interested in upgrading their enterprise cloud subscription.',
          source: 'linkedin',
          lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Bob Miller',
          email: 'bob.m@apexretail.example.com',
          phone: '+1-555-0188',
          status: 'contacted' as const,
          score: 45,
          ownerId: salesUser?.id || adminUser!.id,
          companyId: tenantCompany.id,
          clientId: seededClients.find(c => c.name === 'Apex Retail Group')?.id ?? null,
          notes: 'Sent pricing proposal for multichannel expansion consulting.',
          source: 'manual',
          lastContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Catherine Chang',
          email: 'catherine.c@novabiotech.example.com',
          phone: '+1-555-0177',
          status: 'no_reply' as const,
          score: 20,
          ownerId: adminUser!.id,
          companyId: tenantCompany.id,
          clientId: seededClients.find(c => c.name === 'Nova BioTech')?.id ?? null,
          notes: 'Cold outreach sent to Chief Technology Officer.',
          source: 'csv_import',
        },
        {
          name: 'David Smith',
          email: 'david.s@summitfin.example.com',
          phone: '+1-555-0166',
          status: 'lost' as const,
          score: 10,
          ownerId: salesUser?.id || adminUser!.id,
          companyId: tenantCompany.id,
          clientId: seededClients.find(c => c.name === 'Summit Financials')?.id ?? null,
          notes: 'Decided to stay with their current wealth management vendor.',
          source: 'webhook',
          lastContactedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Emma Watson',
          email: 'emma.w@greenenergy.example.com',
          phone: '+1-555-0155',
          status: 'qualified' as const,
          score: 95,
          ownerId: salesUser?.id || adminUser!.id,
          companyId: tenantCompany.id,
          clientId: seededClients.find(c => c.name === 'GreenEnergy Co.')?.id ?? null,
          notes: 'High interest in setting up commercial solar array next quarter.',
          source: 'linkedin',
          lastContactedAt: new Date(),
        },
        {
          name: 'Frank Ocean',
          email: 'frank.o@independent.com',
          phone: '+1-555-0144',
          status: 'no_reply' as const,
          score: 30,
          ownerId: salesUser?.id || adminUser!.id,
          companyId: tenantCompany.id,
          notes: 'Individual consultant, looking for single user license option.',
          source: 'website',
        }
      ];

      for (const leadData of leadsData) {
        const score = leadData.score;
        const priority = score >= 67 ? 'high' as const : score >= 34 ? 'medium' as const : 'low' as const;

        await prisma.lead.create({
          data: {
            ...leadData,
            priority,
          },
        });
      }
    }

    console.log('Database seeding & verification complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

const startServer = async () => {
  await connectDB();
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Database seeding failed:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
