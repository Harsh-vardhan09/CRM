# CRM Setup Guide

This guide walks you through starting up the authentication server and frontend.

## Prerequisites

1. **Node.js** >= 18
2. **PostgreSQL** database running locally or remotely.
3. Make sure the database `crm` exists on your PostgreSQL server (e.g. `CREATE DATABASE crm;`).

## Configuration

We have created environment configuration files for both the server and frontend apps:

1. **Backend**: [apps/server/.env](file:///c:/CRM/CRM/apps/server/.env)
   - Update the `DATABASE_URL` with your actual PostgreSQL user, password, and database name.
   - Example: `DATABASE_URL=postgres://your_user:your_password@127.0.0.1:5432/crm`

2. **Frontend**: [apps/web/.env](file:///c:/CRM/CRM/apps/web/.env)
   - Contains the backend API endpoint (`NEXT_PUBLIC_API_URL`).

---

## Step 1: Install Dependencies

From the root of the project, run:

```bash
npx pnpm@9.0.0 install
```

---

## Step 2: Start the Development Servers

You can run both the Express backend and the Next.js frontend concurrently using the global Turbo script:

```bash
npx pnpm@9.0.0 dev
```

Alternatively, you can run them in separate terminal windows:

### Run Backend Only

```bash
npx pnpm@9.0.0 --filter server dev
```

- The backend will connect to Postgres, automatically compile TypeScript, synchronize models, and seed default test accounts.
- Runs on: `http://localhost:5000`

### Run Frontend Only

```bash
npx pnpm@9.0.0 --filter web dev
```

- Starts the Next.js development server.
- Runs on: `http://localhost:3000`

---

## Test Accounts (Auto-Seeded)

When the server starts for the first time on a fresh database, it will automatically populate the following accounts for immediate login:

| Email                | Password   | Role          | Description                   |
| -------------------- | ---------- | ------------- | ----------------------------- |
| `admin@crm.com`      | `admin123` | `admin`       | Full workspace permissions    |
| `sales@crm.com`      | `sales123` | `sales_rep`   | Scoped sales rep capabilities |
| `superadmin@crm.com` | `super123` | `super_admin` | Full system access            |

---

## What's Implemented

### Module 0 — Auth & RBAC
- JWT-based authentication (RS256, 15-min access token + 7-day refresh token via HTTP-only cookies)
- Feature-based RBAC: `Company → Role → RolePermission → Feature` hierarchy
- Join request flow: sign-up puts users in `pending`; admins approve/reject from Team Management
- Password reset flow (forgot-password email → `/reset-password?token=...`)
- Account settings (update profile + change password at `/settings`)

### Module 1 — Client/Account Management
- Client CRUD at `/api/clients` with auto-generated `ACC-XXXXXX` account IDs
- Frontend list (`/clients`) and detail page (`/clients/:id`) with inline editing
- Company settings page for owners/super-admins (`/admin/company`)

### Module 2 — Lead Management & Cross-Channel Messaging
- Lead CRUD at `/api/leads` with status/priority/score/source fields
- Cross-channel interaction timeline: send EMAIL/SMS/WhatsApp to a lead from the detail page
- Incoming WhatsApp and email webhooks now auto-link messages to matching Leads by phone/email
- BullMQ workers: `leadMessageWorker` (dispatches via Twilio/Resend), `leadDecayWorker` (daily job marks stale leads inactive)
- Frontend: `/leads` list with filter chips, `/leads/:id` chat-bubble timeline with compose bar
- `LEAD_INACTIVITY_DAYS` env var (default 14) controls the decay threshold

### Module 3 — Dashboard Analytics & Automations
- Analytics API at `/api/dashboard/stats` and `/api/dashboard/pipeline` (companyId-scoped aggregates, no N+1)
- Frontend dashboard at `/dashboard`: stat cards, pipeline funnel bars, channel attribution bars, recent activity feed
- Automation CRUD at `/api/automations` — trigger: `LEAD_INACTIVE`, action: `SEND_MESSAGE`
- `leadDecayWorker` extended: after marking leads inactive, fires enabled `LEAD_INACTIVE` automations and enqueues messages through the existing `leadMessageQueue` path
- Frontend automations page at `/automations`: list, enable/disable toggle, create modal

### Support Inbox
- Inbound WhatsApp and email tickets at `/support`
- Send outbound messages from the ticket thread (BullMQ-backed, Twilio/Resend)
