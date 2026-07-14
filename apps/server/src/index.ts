import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB, prisma } from "@repo/db";
import type { Client, AccessLevel } from "@repo/db";
import authRoutes from "./routes/authRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3031',
      'http://127.0.0.1:3031',
      'http://localhost:3032',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001'
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/team", teamRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const seedDatabase = async () => {
  try {
    // 1. Seed global system Features
    const defaultFeatures = [
      { code: "leads_management", description: "Lead Management Interface" },
      { code: "analytics", description: "Reporting and Analytics Dashboard" },
      { code: "automations", description: "Cron and Workflow Automations" },
      {
        code: "settings",
        description: "Global System and Organization Settings",
      },
      { code: "feature_support", description: "WhatsApp Ticketing and Support" },
    ];

    for (const feat of defaultFeatures) {
      await prisma.feature.upsert({
        where: { code: feat.code },
        update: { description: feat.description },
        create: feat,
      });
    }

    const dbFeatures = await prisma.feature.findMany();

    // 6. Seed Users
    const defaultUsers = [
      {
        email: "superadmin@crm.com",
        password: "super123",
        name: "Super Admin User",
        isOwner: false,
        isSuperAdmin: true,
        roleId: null,
        companyId: null,
      },
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
          console.log(
            `Fixing corrupted/incorrect password hash for user: ${u.email}`,
          );
          const salt = await bcrypt.genSalt(12);
          const passwordHash = await bcrypt.hash(cred.password, salt);
          await prisma.user.update({
            where: { id: u.id },
            data: { passwordHash },
          });
        }
      }
    }



    console.log("Database seeding & verification complete.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

const startServer = async () => {
  await connectDB();

  // BACKFILL: Update existing users to active to avoid locking them out
  try {
    const result = await prisma.user.updateMany({
      where: { status: "pending" },
      data: { status: "active" },
    });
    console.log(`Backfilled ${result.count} users to active status.`);
  } catch (err) {
    console.error("Backfill failed:", err);
  }

  try {
    await seedDatabase();
  } catch (err) {
    console.error("Database seeding failed:", err);
  }

  app.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
  });
};

startServer();
