import crypto from "crypto";
import type { User, Lead, Client } from "@repo/db";

export function toSafeUserJSON(user: User) {
  const { passwordHash, refreshTokenHash, ...safe } = user;
  return safe;
}

export function toSafeLeadJSON(lead: Lead) {
  const { email, phone, notes, ...safe } = lead;
  return safe;
}

export function toSafeClientJSON(client: Client) {
  const { revenue, address, description, ...safe } = client;
  return safe;
}

export function hasPermission(
  user: any,
  featureCode: string,
  requiredAccess: "read" | "write" | "full",
): boolean {
  if (user.isSuperAdmin) return true;

  const permissions = user.role?.permissions || [];
  const perm = permissions.find((p: any) => p.feature?.code === featureCode);
  if (!perm) return false;

  const levels = { read: 1, write: 2, full: 3 };
  const userLevel = levels[perm.accessLevel as keyof typeof levels] || 0;
  const reqLevel = levels[requiredAccess] || 0;

  return userLevel >= reqLevel;
}

export function getFrontendPermissions(user: any) {
  return {
    can_view_leads: hasPermission(user, "leads_management", "read"),
    can_edit_leads: hasPermission(user, "leads_management", "write"),
    can_delete_leads: hasPermission(user, "leads_management", "full"),
    can_export_data: hasPermission(user, "analytics", "read"),
    can_run_automations: hasPermission(user, "automations", "read"),
    can_invite_users: hasPermission(user, "settings", "write"),
  };
}

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
