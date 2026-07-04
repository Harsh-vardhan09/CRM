# Multi-Channel Lead Engagement System — Technical Spec & Module Breakdown

## 1. Purpose

Companies using the CRM need to reach leads over **Email, SMS, and WhatsApp**, and every reply a lead sends back needs to be captured automatically — which channel it came in on, what was said, and when — so the system can tell the difference between a lead that's still engaging ("active") and one that's gone quiet ("inactive").

This document breaks that feature into independent modules so multiple developers can work in parallel, explains **why** each piece exists (not just what to build), and gives a step-by-step build order.

---

## 2. Core Concepts (read this before writing code)

| Concept | What it means | Why it matters |
|---|---|---|
| **Lead** | A person/company record you're trying to convert | The central entity everything attaches to |
| **Interaction** | A single event — one outbound message sent, or one inbound reply received | This is your audit trail. Without it you can only know the *current* state, never *how you got there* |
| **Channel** | EMAIL / SMS / WHATSAPP / OTHER | Each has a different provider, different rate limits, different compliance rules |
| **Origin channel** | The channel the lead first arrived/was first contacted on | Useful for attribution reporting ("which channel brings the best leads") |
| **Last channel** | Most recent channel used, either direction | Drives UI — "reply via the channel they last used" |
| **Active / Inactive** | Derived state based on recency of interaction | This should **never** be manually toggled by a human as the primary mechanism — it should be computed, so it stays trustworthy |

**Key design decision:** Don't just store the *current* channel/status on the Lead. Store every interaction as its own row (`LeadInteraction`), then derive summary fields (`lastChannel`, `lastContactedAt`, `isActive`) onto the `Lead` for fast dashboard queries. This gives you both speed (denormalized fields) and history (interaction log) without picking one at the cost of the other.

---

## 3. Final Data Model

```prisma
enum LeadChannel {
  EMAIL
  SMS
  WHATSAPP
  OTHER
}

enum InteractionDirection {
  OUTBOUND
  INBOUND
}

enum InteractionStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
  RECEIVED
}

model Lead {
  id    Int     @id @default(autoincrement())
  name  String  @db.VarChar(255)
  email String? @db.VarChar(320)
  phone String? @db.VarChar(30)

  status   LeadStatus   @default(no_reply)
  score    Int          @default(0)
  priority LeadPriority @default(low)

  isActive           Boolean      @default(true)
  originChannel       LeadChannel?
  lastChannel         LeadChannel?
  lastContactedAt     DateTime?
  lastInteractionAt   DateTime?
  optedOut            Boolean      @default(false)

  notes     String?  @db.Text
  source    String?  @db.VarChar(100)

  companyId Int
  ownerId   Int
  clientId  Int?

  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  owner        User              @relation("LeadOwner", fields: [ownerId], references: [id])
  client       Client?           @relation(fields: [clientId], references: [id])
  interactions LeadInteraction[]

  @@index([companyId, status])
  @@index([companyId, priority])
  @@index([companyId, ownerId])
  @@index([companyId, isActive])
  @@map("leads")
}

model LeadInteraction {
  id        Int                  @id @default(autoincrement())
  leadId    Int
  channel   LeadChannel
  direction InteractionDirection
  status    InteractionStatus    @default(QUEUED)

  content         String?  @db.Text
  externalId      String?  @db.VarChar(255)
  providerPayload Json?

  createdAt DateTime @default(now())

  lead Lead @relation(fields: [leadId], references: [id])

  @@index([leadId, createdAt])
  @@index([externalId])
  @@map("lead_interactions")
}
```

**Why each new field exists:**
- `isActive` — cheap boolean the dashboard filters on constantly; recomputed by a scheduled job, not set by hand.
- `originChannel` — set once, never overwritten, for attribution reports.
- `lastChannel` / `lastContactedAt` / `lastInteractionAt` — denormalized for list views so you're not aggregating `LeadInteraction` on every page load.
- `optedOut` — SMS/WhatsApp compliance (TCPA and WhatsApp Business policy both require honoring opt-outs); check this before every send.
- `LeadInteraction.externalId` — the provider's message ID (Twilio SID, Resend email ID, etc.), used to match inbound delivery-status webhooks back to the row you created.
- `LeadInteraction.providerPayload` — raw JSON from the provider, kept for debugging when a send/receive behaves unexpectedly.

---

## 4. Repo Structure (Turborepo)

```
apps/
  web/       → Next.js: dashboard UI + API routes + webhook receivers
  worker/    → Node process: queued sends + scheduled jobs (cron)
packages/
  db/        → Prisma schema + generated client (single source of truth)
  messaging/ → channel adapters (email/sms/whatsapp) behind one interface
  queue/     → BullMQ/Redis job definitions shared by web + worker
  ui/        → shared React components (optional)
```

**Why split `web` and `worker`:** sending a message can be slow (provider latency, rate limits, retries). If you send inline from an API route, you tie up a serverless function and risk timeouts. Enqueue instead, and let a long-running worker process handle retries safely.

**Why `packages/db` is its own package:** both `web` and `worker` need the same Prisma client and the same schema. A shared package prevents schema drift and duplicate `PrismaClient` instantiation (which exhausts DB connections if done per-request).

---

## 5. Module Breakdown

Each module below is scoped so one developer can own it with minimal blocking on the others. Suggested build order: **1 → 2 → 3 → 4 → 5 → 6 → 7**, but 2 and 5 can run in parallel once 1 is done.

### Module 1 — Database & Schema
**Owner:** backend dev
**Depends on:** nothing (do this first)

Steps:
1. Add the enums and fields above to `packages/db/schema.prisma`.
2. Run `npx prisma migrate dev --name add_lead_interactions` to generate and apply the migration.
3. Add a `normalizePhone` helper (E.164 format, e.g. `+15551234567`) used everywhere a phone number is written or read — inbound webhook matching will silently fail otherwise, since providers send numbers in E.164 but your forms might not.
4. Seed a few test leads with real (or test-mode) email/phone values for later integration testing.

**Why this is first:** every other module reads or writes this schema. Get field names and enums locked before anyone builds against them.

**Done when:** migration applies cleanly, `LeadInteraction` table exists, `packages/db` exports a typed `PrismaClient` singleton.

---

### Module 2 — Messaging Adapters
**Owner:** backend dev
**Depends on:** Module 1 (for types only)

Steps:
1. Define a single interface all channels implement:
```ts
export interface SendResult { externalId: string; status: "SENT" | "FAILED"; }
export interface ChannelAdapter { send(to: string, body: string): Promise<SendResult>; }
```
2. Implement `emailAdapter` (Resend, Postmark, or SendGrid — pick one with inbound-parse webhook support, needed later in Module 4).
3. Implement `smsAdapter` and `whatsappAdapter` using Twilio (Twilio covers both SMS and WhatsApp Business API under one account, just a different `from:` prefix).
4. Export an `adapters: Record<LeadChannel, ChannelAdapter>` map.

**Why one interface:** the rest of the app (queue jobs, API routes) should never branch on "if channel is X do Y" beyond picking the adapter. This keeps business logic channel-agnostic and makes adding a 4th channel later a one-file change.

**Done when:** each adapter can send a real test message in the provider's sandbox/test mode and return a valid `externalId`.

---

### Module 3 — Queue & Worker
**Owner:** backend dev
**Depends on:** Module 1, Module 2

Steps:
1. Set up BullMQ with Redis in `packages/queue` (or Inngest if you want a hosted alternative with less infra to manage — worth evaluating before committing).
2. Define the `send-lead-message` job: given `{ leadId, channel, message }`, look up the lead, check `optedOut`, call the right adapter, write a `LeadInteraction` row, and update the Lead's denormalized fields — all inside a `$transaction` so a partial failure never leaves the Lead and the interaction log out of sync.
3. Deploy `apps/worker` as a persistent process (not a serverless function — it needs to stay alive to process the queue).

**Why queue instead of sending directly from the API route:** provider APIs can be slow or rate-limited, and a failed send needs retry logic. A queue gives you retries, backoff, and lets the API respond to the user instantly ("message queued") instead of waiting on a third-party network call.

**Done when:** hitting the "contact lead" endpoint results in a message actually arriving, and a `LeadInteraction` row + updated `Lead.lastContactedAt` shows up in the DB.

---

### Module 4 — Inbound Webhooks
**Owner:** backend dev
**Depends on:** Module 1, Module 3

This is the module that makes the system a real CRM instead of a one-way blaster.

Steps:
1. Create one webhook route per provider under `apps/web/app/api/webhooks/{email,sms,whatsapp}/route.ts`.
2. **Always verify the request signature first** (Twilio and most email providers sign their webhooks — reject anything that doesn't verify, or anyone can forge inbound messages into your CRM).
3. Normalize the payload to `{ from, body }`, look up the Lead by normalized phone/email.
4. If found, write an `INBOUND` `LeadInteraction` and update `lastChannel`, `lastInteractionAt`, `isActive: true`, and `status` (e.g. flip `LeadStatus` to `replied`).
5. If not found, log it and return `200 OK` regardless (providers retry aggressively on non-200 responses — always return success once you've safely handled or discarded the payload).
6. Also handle **delivery-status webhooks** (separate from inbound-message webhooks) to update `LeadInteraction.status` from `SENT` → `DELIVERED`/`READ`/`FAILED`, matched via `externalId`.

**Why this matters most:** without this module, you only ever know what you *sent*, never what came back. The whole "active vs inactive" and "which channel to use next" logic depends on inbound data existing.

**Done when:** replying to a test message via each channel creates a visible `LeadInteraction` row and updates the Lead's `lastChannel`/`lastInteractionAt` in near real time.

---

### Module 5 — API Routes (App-Facing)
**Owner:** backend/full-stack dev
**Depends on:** Module 3

Steps:
1. `POST /api/leads/:id/contact` — validates `{ channel, message }`, checks `optedOut`, enqueues the send job. Returns immediately with `{ queued: true }`.
2. `GET /api/leads/:id/interactions` — paginated interaction history for the lead detail view.
3. `GET /api/leads?isActive=true&channel=WHATSAPP` — filterable list endpoint for the dashboard.
4. Enforce `companyId` scoping on every query (multi-tenant safety — a company should never be able to read another company's leads).

**Done when:** the frontend can list, filter, and message leads entirely through these routes.

---

### Module 6 — Scheduled Jobs (Activity Decay)
**Owner:** backend dev
**Depends on:** Module 1, Module 3

Steps:
1. Write a `markInactiveLeads` job that flips `isActive: false` for any lead whose `lastInteractionAt` (or `createdAt` if never contacted) is older than a configurable cutoff (e.g. 14 days).
2. Schedule it daily via BullMQ's repeatable jobs (or a cron trigger if using Inngest).
3. Optionally add a companion job that reactivates a lead the moment a new inbound interaction arrives — though Module 4 already does this synchronously on webhook receipt, so this job only needs to handle the *decay* direction.

**Why derive instead of manually toggle:** if humans set `isActive` by hand, it silently goes stale the moment someone forgets. A scheduled job keeps it an honest, automatic reflection of real engagement.

**Done when:** a lead with no activity for the cutoff period flips to inactive automatically, and reactivates automatically on the next reply.

---

### Module 7 — Frontend Dashboard
**Owner:** frontend dev
**Depends on:** Module 5 (can build against mocked responses earlier in parallel)

Steps:
1. Lead list view — filterable by `isActive`, `status`, `priority`, `lastChannel`.
2. Lead detail view — shows the full `LeadInteraction` timeline (both directions, all channels, chronological) plus a "contact via" composer with a channel picker (disable channels the lead has no valid `email`/`phone` for, or where `optedOut` is true).
3. Visual indicator for active vs inactive (e.g. a colored dot + "last active 3 days ago").
4. Attribution view (optional, later) — leads grouped by `originChannel` to answer "which channel brings us the most engaged leads."

**Done when:** a rep can see a lead's full cross-channel history in one place and message them without knowing which provider is behind the scenes.

---

### Module 8 — Compliance & Safety (cross-cutting, not a phase)
**Owner:** whoever owns Modules 2–4, reviewed by all
**Depends on:** ongoing, applies throughout

- Respect `optedOut` before every outbound send — check it in the queue job, not just the UI, since the job is the last line of defense.
- Provide an easy opt-out path (e.g. lead replies "STOP" → Module 4 webhook logic sets `optedOut: true` automatically, standard practice for SMS/WhatsApp).
- Store only what you need in `providerPayload` — avoid logging full message bodies in provider payloads if your provider already includes them elsewhere, to avoid duplicate PII storage.
- Rate-limit outbound sends per lead (e.g. no more than one message per channel per X hours) to avoid provider throttling and to avoid looking like spam to the lead.

---

## 6. Suggested Timeline (rough, adjust per team size)

| Module | Depends on | Est. effort |
|---|---|---|
| 1. Database & Schema | — | 0.5–1 day |
| 2. Messaging Adapters | 1 | 1–2 days |
| 3. Queue & Worker | 1, 2 | 1–2 days |
| 4. Inbound Webhooks | 1, 3 | 2–3 days |
| 5. API Routes | 3 | 1 day |
| 6. Scheduled Jobs | 1, 3 | 0.5 day |
| 7. Frontend Dashboard | 5 | 3–4 days |
| 8. Compliance (cross-cutting) | ongoing | woven throughout |

Modules 2 and 7 (UI shell, mocked data) can start in parallel with Module 1 if you lock the field names/types up front.

---

## 7. Open Decisions to Make Before Building

1. **Provider choice** — Resend/Postmark/SendGrid for email (must support inbound parse); Twilio for SMS + WhatsApp.
2. **Queue tech** — BullMQ (self-hosted Redis, more control) vs Inngest (hosted, less infra, easier retries/webhooks).
3. **Inactivity cutoff** — how many days of silence before a lead is "inactive"? This is a business decision, not a technical one — make it configurable per company rather than hardcoded.
4. **Multi-tenant enforcement** — decide now whether `companyId` scoping is enforced via a Prisma middleware/extension (applied globally) or manually in every query (error-prone) — middleware is strongly recommended.
