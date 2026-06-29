import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import type { User } from "../generated/prisma/client.js";

// ─── Soft-delete extension ────────────────────────────────────────────────────

const SOFT_DELETE_MODELS = ["User", "Client", "Lead"] as const;
type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

const softDeleteExtension = {
  query: {
    $allModels: {
      async findFirst({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async findMany({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async findUnique({ args, query }: any) {
        return query(args);
      },
      async count({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) args.where = { deletedAt: null, ...args.where };
        return query(args);
      },
      async aggregate({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) (args as any).where = { deletedAt: null, ...(args as any).where };
        return query(args);
      },
    },
  },
};

// ─── Prisma client ────────────────────────────────────────────────────────────

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const base    = new PrismaClient({ adapter });

export const prisma = base.$extends(softDeleteExtension) as unknown as PrismaClient;

export const connectDB = async (): Promise<void> => {
  try {
    await (prisma as any).$connect();
    console.log("PostgreSQL connected.");
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
};

import type { AccessLevel } from "../generated/prisma/client.js";

const LEVEL_RANK: Record<AccessLevel, number> = { read: 1, write: 2, full: 3 };

// ─── Permission helpers ───────────────────────────────────────────────────────

export async function getRolePermissions(
  prismaClient: PrismaClient,
  roleId: number,
): Promise<Record<string, AccessLevel>> {
  const perms = await prismaClient.rolePermission.findMany({
    where:  { roleId },
    select: { accessLevel: true, feature: { select: { code: true } } },
  });
  return Object.fromEntries(perms.map((p) => [p.feature.code, p.accessLevel as AccessLevel]));
}

export async function hasPermission(
  prismaClient: PrismaClient,
  roleId: number | null | undefined,
  featureCode: string,
  required: AccessLevel = "read",
): Promise<boolean> {
  if (!roleId) return false;
  const perm = await prismaClient.rolePermission.findFirst({
    where: { roleId, feature: { code: featureCode } },
    select: { accessLevel: true },
  });
  if (!perm) return false;
  return LEVEL_RANK[perm.accessLevel as AccessLevel] >= LEVEL_RANK[required];
}

// ─── Safe serialisers ─────────────────────────────────────────────────────────

export function toSafeUserJSON(user: Record<string, unknown>) {
  const { passwordHash: _p, refreshTokenHash: _r, ...safe } = user;
  void _p; void _r;
  return safe;
}

export function getFrontendPermissions(user: any) {
  const perms = user.permissions || {};
  const leadsVal = perms["leads_management"];
  return {
    can_view_leads:      user.isSuperAdmin || ["read", "write", "full"].includes(leadsVal),
    can_edit_leads:      user.isSuperAdmin || ["write", "full"].includes(leadsVal),
    can_delete_leads:    user.isSuperAdmin || leadsVal === "full",
    can_export_data:     user.isSuperAdmin || perms["exports"] !== undefined || perms["analytics"] !== undefined,
    can_run_automations: user.isSuperAdmin || perms["automations"] !== undefined,
    can_invite_users:    user.isSuperAdmin || perms["user_management"] === "full",
  };
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function verifyRefreshTokenHash(user: User, rawToken: string): boolean {
  if (!user.refreshTokenHash) return false;
  const incoming = hashRefreshToken(rawToken);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(incoming, "hex"),
      Buffer.from(user.refreshTokenHash, "hex"),
    );
  } catch {
    return false;
  }
}

// ─── Re-export generated types ────────────────────────────────────────────────

export type { User, Client, Role, Feature, Company, AccessLevel, Lead } from "../generated/prisma/client.js";
