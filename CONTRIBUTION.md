# Contributions Log

## [Current Date] - Authentication & Join Request Flow Implementation

### 1. Database & Prisma Configuration

- **Supabase PgBouncer Fix**: Updated `apps/server/.env` to include `?pgbouncer=true` in the `DATABASE_URL` to prevent Prisma `ETIMEDOUT` errors when using connection pooling.
- **Prisma Adapter Initialization**: Corrected `packages/database/src/client.ts` to instantiate and pass a proper `pg` `Pool` to `@prisma/adapter-pg`.
- **Schema Updates**: Added the `UserStatus` enum (`active`, `pending`, `rejected`) and a `status` field to the `User` model (defaulting to `pending`) in `schema.prisma`.

### 2. Backend Authentication Logic (`apps/server`)

- **Signup Controllers**:
  - `signUpCompany`: Registers a new company and CEO. The CEO is instantly marked as `active`, automatically logged in (JWT cookies are generated and set), and receives the default `Admin` role.
  - `signUpEmployee`: Registers a normal worker under an existing company. They are marked as `pending` and are not automatically logged in.
- **Login Guard**: Updated `login` in `authController.ts` to verify user status before issuing tokens. Returns a 403 Forbidden for `pending` or `rejected` accounts.
- **Admin Join-Request API**:
  - Added new routes: `GET /company/join-requests`, `PATCH /company/join-requests/approve`, `PATCH /company/join-requests/reject`, and `GET /company/roles`.
  - Protected these routes using `protect` and `restrictTo('Admin')`, allowing any company administrator to manage incoming employees.

### 3. Frontend & UI Updates (`apps/web`)

- **Signup Page Enhancements**:
  - Added `credentials: 'include'` to `fetch` requests in `apps/web/app/signup/page.tsx` so the browser correctly stores HttpOnly cookies set by the backend.
  - Implemented auto-redirect logic that seamlessly pushes new Company Owners to `/admin/join-requests` upon successful signup.
- **Join Requests Dashboard**:
  - Created a new Next.js component at `apps/web/app/admin/join-requests/page.tsx`.
  - Matches the project's sleek, dark-mode glassmorphic aesthetic.
  - Allows Admins to view pending requests, select a specific role from a dynamically fetched dropdown, and approve or reject the employee.
