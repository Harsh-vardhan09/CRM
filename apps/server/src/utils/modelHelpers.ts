import crypto from 'crypto';
import type { User, Lead, Company } from '@prisma/client';

export function toSafeUserJSON(user: User) {
  const { passwordHash, refreshToken, refreshTokenHash, ...safe } = user;
  return safe;
}

export function toSafeLeadJSON(lead: Lead) {
  const { email, phone, notes, ...safe } = lead;
  return safe;
}

export function toSafeCompanyJSON(company: Company) {
  const { revenue, address, description, ...safe } = company;
  return safe;
}

export function hasPermission(user: User, permissionKey: string): boolean {
  const perms = user.permissions as Record<string, boolean> | null;
  return Boolean(perms?.[permissionKey]);
}

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
