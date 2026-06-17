import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, sequelize } from './config/db.js';
import { Organisation } from './models/Organisation.js';
import { User } from './models/User.js';
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
app.get('/api/health', (req, res) => {
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
    console.log('Database seeding & verification complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Start Server
const startServer = async () => {
  // Connect DB
  await connectDB();

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
