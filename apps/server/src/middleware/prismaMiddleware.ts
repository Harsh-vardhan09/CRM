import type { PrismaClient } from '@prisma/client';
import type { User }         from '@prisma/client';
import crypto                from 'crypto';

// ─── Soft-delete extension ────────────────────────────────────────────────────

const SOFT_DELETE_MODELS = ['User', 'Client', 'Lead'] as const;
type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

/**
 * Prisma Client Extension (plain object — no Prisma namespace needed).
 * Applied via `new PrismaClient().$extends(softDeleteExtension)` in db.ts.
 *
 * - findFirst / findMany / count / aggregate → injects `deletedAt: null` filter
 * - delete / deleteMany → converts to a soft-update (sets deletedAt)
 */
export const softDeleteExtension = {
  query: {
    $allModels: {
      async findFirst({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) {
          args.where = { deletedAt: null, ...args.where };
        }
        return query(args);
      },
      async findMany({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) {
          args.where = { deletedAt: null, ...args.where };
        }
        return query(args);
      },
      async findUnique({ args, query }: any) {
        // findUnique cannot add arbitrary filters; controllers should use
        // findFirst when soft-delete filtering is needed.
        return query(args);
      },
      async count({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) {
          args.where = { deletedAt: null, ...args.where };
        }
        return query(args);
      },
      async aggregate({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) {
          args.where = { deletedAt: null, ...args.where };
        }
        return query(args);
      },
      async delete({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) {
          // Re-route hard delete → soft update
          const key = model[0].toLowerCase() + model.slice(1) as keyof PrismaClient;
          return (query as any).__self[key].update({
            where: args.where,
            data:  { deletedAt: new Date() },
          });
        }
        return query(args);
      },
      async deleteMany({ model, args, query }: any) {
        if (isSoftDeleteModel(model)) {
          const key = model[0].toLowerCase() + model.slice(1) as keyof PrismaClient;
          return (query as any).__self[key].updateMany({
            where: args.where,
            data:  { deletedAt: new Date() },
          });
        }
        return query(args);
      },
    },
  },
};

// ─── Permission helpers ───────────────────────────────────────────────────────

export type AccessLevel = 'read' | 'write' | 'full';

/** Ordered tiers — 'full' satisfies any level check */
const LEVEL_RANK: Record<AccessLevel, number> = { read: 1, write: 2, full: 3 };

/**
 * Check whether a user's role grants at least `required` access to `featureCode`.
 */
export async function hasPermission(
  prisma:      PrismaClient,
  roleId:      number | null | undefined,
  featureCode: string,
  required:    AccessLevel = 'read',
): Promise<boolean> {
  if (!roleId) return false;

  const perm = await prisma.rolePermission.findFirst({
    where: {
      roleId,
      feature: { code: featureCode },
    },
    select: { accessLevel: true },
  });

  if (!perm) return false;
  return LEVEL_RANK[perm.accessLevel as AccessLevel] >= LEVEL_RANK[required];
}

/**
 * Return the full permission map for a role — useful for attaching to the
 * /me response so the frontend can gate UI features without extra round-trips.
 */
export async function getRolePermissions(
  prisma:  PrismaClient,
  roleId:  number,
): Promise<Record<string, AccessLevel>> {
  const perms = await prisma.rolePermission.findMany({
    where:  { roleId },
    select: { accessLevel: true, feature: { select: { code: true } } },
  });

  return Object.fromEntries(
    perms.map((p) => [p.feature.code, p.accessLevel as AccessLevel]),
  );
}

// ─── Safe serialisers ─────────────────────────────────────────────────────────

type RawUser = {
  id:           number;
  email:        string;
  name:         string;
  avatar:       string | null;
  companyId:    number | null;
  roleId:       number | null;
  isOwner:      boolean;
  isSuperAdmin: boolean;
  lastLoginAt:  Date | null;
  createdAt:    Date;
  updatedAt:    Date;
  passwordHash?:     string;
  refreshTokenHash?: string | null;
};

/** Strip sensitive fields before sending to the client. */
export function toSafeUserJSON(user: RawUser) {
  const { passwordHash: _p, refreshTokenHash: _r, ...safe } = user as any;
  void _p; void _r;
  return safe;
}

type RawLead = {
  id:       number;
  name:     string;
  email?:   string | null;
  phone?:   string | null;
  notes?:   string | null;
  [key: string]: unknown;
};

/** Strip PII for list endpoints. */
export function toSafeLeadJSON(lead: RawLead) {
  const { email: _e, phone: _p, notes: _n, ...safe } = lead;
  void _e; void _p; void _n;
  return safe;
}

// ─── Frontend Compatibility Mapper ───────────────────────────────────────────

export function getFrontendPermissions(user: any) {
  const perms = user.permissions || {};
  const leadsVal = perms['leads_management'];
  return {
    can_view_leads:       user.isSuperAdmin || ['read', 'write', 'full'].includes(leadsVal),
    can_edit_leads:       user.isSuperAdmin || ['write', 'full'].includes(leadsVal),
    can_delete_leads:     user.isSuperAdmin || leadsVal === 'full',
    can_export_data:      user.isSuperAdmin || perms['exports'] !== undefined || perms['analytics'] !== undefined,
    can_run_automations:  user.isSuperAdmin || perms['automations'] !== undefined,
    can_invite_users:     user.isSuperAdmin || perms['user_management'] === 'full',
  };
}

// ─── Token hashing utilities ──────────────────────────────────────────────────

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function verifyRefreshTokenHash(user: User, rawToken: string): boolean {
  if (!user.refreshTokenHash) return false;
  const incoming = hashRefreshToken(rawToken);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(incoming,              'hex'),
      Buffer.from(user.refreshTokenHash, 'hex'),
    );
  } catch {
    return false;
  }
}
