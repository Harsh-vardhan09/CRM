import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, sequelize } from './config/db.js';
import { Organisation, User, Lead, Company, initModels } from './models/index.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Middlewares
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

// Mount Routes
app.use('/api/auth', authRoutes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const seedDatabase = async () => {
  try {
    const orgCount = await Organisation.count();
    let org;
    if (orgCount === 0) {
      console.log('Seeding default Organisation...');
      org = await Organisation.create({
        name: 'Acme CRM Inc.',
        industry: 'Software',
        website: 'https://acme-crm.example.com',
        revenue: 1000000.0,
        employeeCount: 50,
      });
    } else {
      org = await Organisation.findOne();
    }

    if (!org) return;

    const defaultUsers = [
      {
        email: 'admin@crm.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin' as const,
        permissions: {
          can_view_leads: true,
          can_edit_leads: true,
          can_delete_leads: true,
          can_export_data: true,
          can_run_automations: true,
          can_invite_users: true,
        },
      },
      {
        email: 'sales@crm.com',
        password: 'sales123',
        name: 'Sales Representative',
        role: 'sales_rep' as const,
        permissions: {
          can_view_leads: true,
          can_edit_leads: true,
          can_delete_leads: false,
          can_export_data: false,
          can_run_automations: false,
          can_invite_users: false,
        },
      },
      {
        email: 'superadmin@crm.com',
        password: 'super123',
        name: 'Super Admin User',
        role: 'super_admin' as const,
        permissions: {
          can_view_leads: true,
          can_edit_leads: true,
          can_delete_leads: true,
          can_export_data: true,
          can_run_automations: true,
          can_invite_users: true,
        },
      }
    ];

    for (const credential of defaultUsers) {
      let u = await User.findOne({ where: { email: credential.email } });
      if (!u) {
        console.log(`Seeding missing user: ${credential.email}`);
        await User.create({
          email: credential.email,
          passwordHash: credential.password, // hooks hash this
          name: credential.name,
          role: credential.role,
          orgId: org.id,
          permissions: credential.permissions,
        });
      } else {
        const isCorrect = await u.comparePassword(credential.password);
        if (!isCorrect) {
          console.log(`Fixing corrupted/incorrect password hash for user: ${u.email}`);
          u.passwordHash = credential.password; // plaintext, hook will hash on save
          await u.save();
        }
      }
    }

    // Seed Companies
    const adminUser = await User.findOne({ where: { email: 'admin@crm.com' } });
    const salesUser = await User.findOne({ where: { email: 'sales@crm.com' } });

    const companyCount = await Company.count();
    let seededCompanies: Company[] = [];
    if (companyCount === 0) {
      console.log('Seeding synthetic Companies...');
      const companiesData = [
        {
          name: 'TechCorp Solutions',
          industry: 'Software',
          website: 'https://techcorp.example.com',
          revenue: 12500000.00,
          employeeCount: 450,
          address: 'San Francisco, CA',
          description: 'Enterprise cloud infrastructure provider.',
          orgId: org.id,
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
          orgId: org.id,
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
          orgId: org.id,
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
          orgId: org.id,
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
          orgId: org.id,
          ownerId: salesUser?.id ?? null,
        }
      ];

      for (const compData of companiesData) {
        const c = await Company.create(compData);
        seededCompanies.push(c);
      }
    } else {
      seededCompanies = await Company.findAll();
    }

    // Seed Leads
    const leadCount = await Lead.count();
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
          orgId: org.id,
          companyId: seededCompanies.find(c => c.name === 'TechCorp Solutions')?.id ?? null,
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
          orgId: org.id,
          companyId: seededCompanies.find(c => c.name === 'Apex Retail Group')?.id ?? null,
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
          orgId: org.id,
          companyId: seededCompanies.find(c => c.name === 'Nova BioTech')?.id ?? null,
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
          orgId: org.id,
          companyId: seededCompanies.find(c => c.name === 'Summit Financials')?.id ?? null,
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
          orgId: org.id,
          companyId: seededCompanies.find(c => c.name === 'GreenEnergy Co.')?.id ?? null,
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
          orgId: org.id,
          notes: 'Individual consultant, looking for single user license option.',
          source: 'website',
        }
      ];

      for (const leadData of leadsData) {
        await Lead.create(leadData);
      }
    }

    console.log('Database seeding & verification complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Start Server
const startServer = async () => {
  // Connect DB
  await connectDB();

  // Register all model associations before sync
  initModels();

  // Sync models (creates tables if they don't exist)
  try {
    await sequelize.sync({ alter: true });
    console.log('Database models synced.');
    await seedDatabase();
  } catch (err) {
    console.error('Database sync failed:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
