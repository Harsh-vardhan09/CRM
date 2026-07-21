import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../env/root.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../env/server.env") });

const { connectDB, prisma } = await import("@repo/db");
const { redis } = await import("./utils/redis.service.js");
const authRoutes = (await import("./routes/authRoutes.js")).default;
const supportRoutes = (await import("./routes/supportRoutes.js")).default;
const webhookRoutes = (await import("./routes/webhookRoutes.js")).default;
const teamRoutes = (await import("./routes/teamRoutes.js")).default;
const adminRoutes = (await import("./routes/adminRoutes.js")).default;
const clientRoutes = (await import("./routes/clientRoutes.js")).default;
const leadRoutes = (await import("./routes/leadRoutes.js")).default;
const dashboardRoutes = (await import("./routes/dashboardRoutes.js")).default;
const automationRoutes = (await import("./routes/automationRoutes.js")).default;

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
app.use("/api/admin", adminRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/automations", automationRoutes);

app.get("/api/health", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = "error";
  let redisStatus = "error";

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
    dbStatus = "ok";
  } catch (error) {
    console.error("Health check: database error", error);
  }

  try {
    await Promise.race([
      promisify(redis.ping.bind(redis))(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
    redisStatus = "ok";
  } catch (error) {
    console.error("Health check: redis error", error);
  }

  const responseTime = Date.now() - startTime;
  const statusCode = dbStatus === "ok" && redisStatus === "ok" ? 200 : 503;

  res.status(statusCode).json({
    status: dbStatus === "ok" && redisStatus === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    version: process.env.npm_package_version || "unknown",
    database: dbStatus,
    redis: redisStatus,
    responseTimeMs: responseTime,
  });
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
      { code: "clients", description: "Client/Account Management" },
      { code: "admin", description: "Admin Panel and Company Management" },
      { code: "roles", description: "Role and Permission Management" },
      { code: "users", description: "User Account Management" },
    ];

    for (const feat of defaultFeatures) {
      await prisma.feature.upsert({
        where: { code: feat.code },
        update: { description: feat.description },
        create: feat,
      });
    }

    const dbFeatures = await prisma.feature.findMany();

    // 2. Seed a shared demo company + roles
    let demoCompany = await prisma.company.findFirst({
      where: { name: "Demo Company" },
    });

    if (!demoCompany) {
      demoCompany = await prisma.company.create({
        data: { name: "Demo Company", status: "active" },
      });
    }

    const adminRole = await prisma.role.upsert({
      where: { companyId_name: { companyId: demoCompany.id, name: "Admin" } },
      update: {},
      create: { companyId: demoCompany.id, name: "Admin" },
    });

    const salesRole = await prisma.role.upsert({
      where: { companyId_name: { companyId: demoCompany.id, name: "Sales Rep" } },
      update: {},
      create: { companyId: demoCompany.id, name: "Sales Rep" },
    });

    for (const feature of dbFeatures) {
      await prisma.companyFeature.upsert({
        where: { companyId_featureId: { companyId: demoCompany.id, featureId: feature.id } },
        update: {},
        create: { companyId: demoCompany.id, featureId: feature.id },
      });
    }

    for (const feature of dbFeatures) {
      await prisma.rolePermission.upsert({
        where: { roleId_featureId: { roleId: adminRole.id, featureId: feature.id } },
        update: { accessLevel: "full" },
        create: {
          roleId: adminRole.id,
          featureId: feature.id,
          accessLevel: "full",
        },
      });
    }

    const salesPerms = [
      { code: "leads_management", accessLevel: "write" },
      { code: "analytics", accessLevel: "read" },
      { code: "automations", accessLevel: "read" },
      { code: "settings", accessLevel: "read" },
      { code: "feature_support", accessLevel: "write" },
      { code: "clients", accessLevel: "write" },
    ];

    for (const perm of salesPerms) {
      const feature = dbFeatures.find((f) => f.code === perm.code);
      if (!feature) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_featureId: { roleId: salesRole.id, featureId: feature.id } },
        update: { accessLevel: perm.accessLevel as any },
        create: {
          roleId: salesRole.id,
          featureId: feature.id,
          accessLevel: perm.accessLevel as any,
        },
      });
    }

    // 6. Seed Users
    type SeedUser = {
      email: string;
      password: string;
      name: string;
      isOwner: boolean;
      isSuperAdmin: boolean;
      roleId: number | null;
      companyId: number | null;
      status: "active" | "pending" | "rejected";
    };

    const defaultUsers: SeedUser[] = [
      {
        email: "superadmin@crm.com",
        password: "admin123",
        name: "Super Admin User",
        isOwner: false,
        isSuperAdmin: true,
        roleId: null,
        companyId: null,
        status: "active",
      },
      {
        email: "admin@crm.com",
        password: "admin123",
        name: "Admin User",
        isOwner: false,
        isSuperAdmin: false,
        roleId: adminRole.id,
        companyId: demoCompany.id,
        status: "active",
      },
      {
        email: "sales@crm.com",
        password: "sales123",
        name: "Sales Rep User",
        isOwner: false,
        isSuperAdmin: false,
        roleId: salesRole.id,
        companyId: demoCompany.id,
        status: "active",
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
            status: cred.status,
          },
        });
      } else {
        const updates: Record<string, any> = {};
        if (!(await bcrypt.compare(cred.password, u.passwordHash))) {
          console.log(`Fixing corrupted/incorrect password hash for user: ${u.email}`);
          const salt = await bcrypt.genSalt(12);
          updates.passwordHash = await bcrypt.hash(cred.password, salt);
        }
        if (u.status !== cred.status) updates.status = cred.status;
        if (u.roleId !== cred.roleId) updates.roleId = cred.roleId;
        if (u.companyId !== cred.companyId) updates.companyId = cred.companyId;
        if (u.name !== cred.name) updates.name = cred.name;
        if (Object.keys(updates).length > 0) {
          await prisma.user.update({
            where: { id: u.id },
            data: updates,
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
