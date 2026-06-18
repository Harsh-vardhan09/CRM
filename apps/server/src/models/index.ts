/**
 * models/index.ts — Shubham_schema-feature branch
 *
 * Central registry for all Sequelize models.
 * Import ONLY from this file in controllers, routes, and middleware
 * to avoid circular dependency issues.
 *
 * Responsibilities:
 *  1. Re-export all models and their types.
 *  2. Register all inter-model associations in one safe place.
 *  3. Provide a single `initModels()` function called from server/index.ts.
 *
 * Association map:
 *
 *  Organisation ──< User        (orgId)
 *  Organisation ──< Company     (orgId)
 *  Organisation ──< Lead        (orgId)
 *  User         ──< Lead        (ownerId)
 *  User         ──< Company     (ownerId)
 *  Company      ──< Lead        (companyId)  ← optional link
 */

import { Organisation }            from './Organisation.js';
import { User, associateUser }     from './User.js';
import { Lead, associateLead }     from './Lead.js';
import { Company, associateCompany } from './Company.js';

// ─── Re-exports ───────────────────────────────────────────────────────────────
// Controllers and routes import everything from here — one import, no circles.

export { Organisation };
export { User };
export type { UserRole, UserPermissions, UserAttributes, UserCreationAttributes } from './User.js';

export { Lead };
export type { LeadStatus, LeadPriority, LeadAttributes, LeadCreationAttributes } from './Lead.js';

export { Company };
export type { CompanyAttributes, CompanyCreationAttributes } from './Company.js';

// ─── Association registry ─────────────────────────────────────────────────────

/**
 * initModels()
 *
 * Call this ONCE after sequelize.authenticate() succeeds — before sync().
 * It registers every association between models.
 * Calling it multiple times is safe (Sequelize deduplicates).
 */
export function initModels(): void {
  // ── User ──────────────────────────────────────────────────────────────────
  // Note: User.ts already registers User ↔ Organisation for authMiddleware
  // backwards-compatibility.  Calling associateUser() here is a no-op but
  // documents the intent cleanly.
  associateUser();

  // ── Lead ──────────────────────────────────────────────────────────────────
  associateLead();

  // Lead ↔ Company (companyId) — registered here because both models are
  // already imported; avoids circular import inside Lead.ts.
  Lead.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Company.hasMany(Lead,   { foreignKey: 'companyId', as: 'leads'   });

  // ── Company ───────────────────────────────────────────────────────────────
  associateCompany();

  // ── Organisation ↔ Company ────────────────────────────────────────────────
  // (Organisation → Company is handled inside associateCompany(),
  //  but the reverse hasMany belongs here for clarity.)
  Organisation.hasMany(Company, { foreignKey: 'orgId', as: 'companies' });

  // ── Organisation ↔ Lead ───────────────────────────────────────────────────
  Organisation.hasMany(Lead, { foreignKey: 'orgId', as: 'leads' });

  console.log('[models/index.ts] All model associations registered.');
}
