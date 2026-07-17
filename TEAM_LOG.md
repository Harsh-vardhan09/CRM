# Project Development Log

> This file tracks who worked on what, when they worked, and what remains to be done.

---

## Entry Template

### Date: YYYY-MM-DD

**Developer:** Your Name

**Package/App:**

- apps/web
- apps/admin
- packages/ui
- packages/api
- packages/database

**Changes Made:**

- Added login page
- Fixed authentication bug
- Updated UI components
- Improved API validation

**Files Modified:**

- apps/web/src/app/login/page.tsx
- packages/ui/src/Button.tsx

**Status:**

- ✅ Completed
- 🚧 In Progress
- ❌ Blocked

**Next Tasks:**

- Implement forgot password
- Add unit tests
- Optimize API response

**Notes:**

- Waiting for backend endpoint
- Needs review from teammate

---

## Development History

#### Date-30/6/26

developer- Harsh

**Package/App:**

- server/src/utils/
  - permission.service.ts
  - redis.service.ts
- server/src/middleware/permissionMiddleware

**Changes Made:**

- added permission middleware for what role they have and what is allowed
- added redis for faster retrival of role

---

#### Date - 27/06/26

Developer - Shubham

**Package/App:**

- packages/database

**Changes Made:**

- Designed full RBAC database schema (Company, Role, Feature, CompanyFeature, RolePermission, User, Client, Lead)
- Migrated Prisma from `apps/server` to `packages/database` as shared `@repo/db` workspace package
- Integrated Varun's authentication fields (refreshTokenHash, lastLoginAt, passwordHash) into unified User model
- Created `packages/database/src/index.ts` exporting prisma client, soft-delete extension, token helpers, and permission utilities
- Cleaned up `apps/server` to import everything from `@repo/db` — removed all direct Prisma dependencies from server
- Resolved merge conflict in `pnpm-lock.yaml` after syncing with Harsh's main branch (PostgreSQL + Docker)
- Fixed all TypeScript errors caused by Prisma v7 breaking changes

**Files Modified:**

- packages/database/prisma/schema.prisma
- packages/database/src/index.ts
- packages/database/package.json
- packages/database/tsconfig.json
- packages/database/prisma.config.ts
- apps/server/package.json
- apps/server/src/config/db.ts
- apps/server/src/index.ts
- apps/server/src/controllers/authController.ts
- apps/server/src/middleware/authMiddleware.ts
- pnpm-lock.yaml

**Files Deleted:**

- apps/server/prisma/schema.prisma
- apps/server/prisma/migrations/
- apps/server/prisma.config.ts
- apps/server/src/middleware/prismaMiddleware.ts

**Status:**

- ✅ Completed

**PR:**

- #1 — Shubham schema feature (merged into main)

---

#### Date - 15/07/26

Developer - Deepanshu (Co-authored by Shubham)

**Package/App:**

- apps/server

**Changes Made:**

- Created type definitions for admin operations (`types/admin.types.ts`)
- Implemented request body validation middleware for admin endpoints (`middleware/adminValidationMiddleware.ts`)
- Built admin services (`services/admin.service.ts`) with Prisma transactional logic for:
  - Creating, updating, and listing tenant companies (with user and feature counts)
  - Managing roles and assigning features/permissions
  - Creating, listing, updating roles, and soft-deleting users
- Built admin controller handlers (`controllers/adminController.ts`) to handle incoming HTTP requests and format standard API responses
- Exposed admin routes (`routes/adminRoutes.ts`) and mounted the router under `/api/admin` in the main express server (`index.ts`)

**Files Modified:**

- apps/server/src/index.ts
- TEAM_LOG.md

**Files Created:**

- apps/server/src/types/admin.types.ts
- apps/server/src/middleware/adminValidationMiddleware.ts
- apps/server/src/routes/adminRoutes.ts
- apps/server/src/services/admin.service.ts
- apps/server/src/controllers/adminController.ts

**Status:**

- ✅ Completed

**PR:**

- #5 — feat: implement admin management APIs (Company, Role, Permission, User)

---

#### Date - 17/07/26

Developer - Aarsh (Co-authored by Claude)

**Package/App:**

- packages/database
- apps/server
- apps/workers
- apps/web

**Changes Made (Module 3 — Dashboard Analytics & Automations):**

- Added `Automation` Prisma model with `AutomationTrigger` (LEAD_INACTIVE) and `AutomationAction` (SEND_MESSAGE) enums; additive migration `20260717000003_add_automations_table`
- Dashboard service with `Promise.all`-batched aggregate queries (no N+1): lead counts by status/priority/isActive, client count, open ticket count, message volume groupBy channel+direction for 7d/30d windows, recent activity feed
- Dashboard routes at `GET /api/dashboard/stats` and `GET /api/dashboard/pipeline`, gated behind `checkPermission("analytics", "read")`
- Automation CRUD at `/api/automations` (list/get/create/update/delete), gated behind `checkPermission("automations", <level>)`
- Refactored `leadDecayWorker` from `$executeRaw` to `findMany + updateMany` so stale lead IDs are available; after marking leads inactive, worker now checks each company for enabled `LEAD_INACTIVE` automations and enqueues messages via the existing `leadMessageQueue` path
- Frontend `/dashboard`: stat cards, pipeline funnel (leads by status), channel attribution (leads by originChannel), recent activity feed — all hand-rolled CSS bars, no charting library
- Frontend `/automations`: list table with enable/disable toggle, delete, and create modal scoped to LEAD_INACTIVE trigger + SEND_MESSAGE action
- Added Dashboard and Automations tiles to both `/admin` and `/user` module grids
- Updated `SETUP.md` with "What's Implemented" summary for all modules

**Files Modified:**

- `packages/database/prisma/schema.prisma` — Automation model + enums + Company.automations relation
- `packages/database/src/index.ts` — re-export Automation, AutomationTrigger, AutomationAction
- `apps/server/src/index.ts` — mount dashboardRoutes + automationRoutes
- `apps/workers/src/workers/leadDecayWorker.ts` — refactor + automation trigger logic
- `apps/web/app/admin/page.tsx` — Dashboard + Automations tiles
- `apps/web/app/user/page.tsx` — Dashboard + Automations tiles
- `SETUP.md` — "What's Implemented" section

**Files Created:**

- `packages/database/prisma/migrations/20260717000003_add_automations_table/migration.sql`
- `apps/server/src/services/dashboard.service.ts`
- `apps/server/src/controllers/dashboardController.ts`
- `apps/server/src/routes/dashboardRoutes.ts`
- `apps/server/src/services/automation.service.ts`
- `apps/server/src/controllers/automationController.ts`
- `apps/server/src/routes/automationRoutes.ts`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/automations/page.tsx`

**Status:**

- ✅ Completed

---

