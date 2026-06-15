## FUNCTIONAL Requirements:-

1. Registration and login
2. Customer Management
3. Lead Management
4. Customer service and support
5. Reporting and analytics

### Specifics:-
- Platform Connectivity
- Automation for CRON jobs and work
- Specific CRM based on the company

## NON-FUNCTIONAL Requirements:-
1. Security
2. Performance
3. 24/7 uptime
4. Reliable and Scalable
5. Data tracking and future connectivity

## Tools and Tech

| **Layer**        | **Technology**           | **Rationale**                                 |
| ---------------- | ------------------------ | --------------------------------------------- |
| Frontend         | Next.js 14 + TypeScript  | SSR, file-based routing, App Router layouts   |
| Styling          | Tailwind CSS + shadcn/ui | Utility-first, consistent design tokens       |
| State management | Redux                    | Local state + server cache management         |
| API (primary)    | GraphQL (Apollo)         | Typed queries, real-time subscriptions        |
| API (secondary)  | REST (Express)           | Webhooks, file uploads, auth                  |
| Database         | Postgres & no sql        | schema for CRM data models                    |
| Cache            | Redis (Upstash)          | Sessions, priority sorted sets, rate limiting |
| Message queue    | RabbitMQ (CloudAMQP)     | Async workflow actions, cron dispatch         |
| Auth             | JWT + NextAuth.js        | OAuth + credentials, token rotation           |
| Real-time        | webSockets/socket.io     | In-app notifications                          |
| Monorepo         | Turborepo + pnpm         | Shared code, parallel builds, caching         |


![[/public/req.png|100%]]

## Classes and ROLES

- Super admin
- Admin 
- Saled rep
- leads

![[/public/flow.png|100%]]

## Core data models

![[/public/db.png|100%]]

## API Specification

### GraphQL API (Primary)

All frontend data operations use the GraphQL API. Key query and mutation categories:

|   |   |   |
|---|---|---|
|**Category**|**Operations**|**Auth required**|
|Auth|login, logout, refreshToken|No (login); Yes (logout, refresh)|
|Users|me, users, createUser, updateUser, deleteUser|Yes — Admin+|
|Leads|leads, lead, createLead, updateLead, deleteLead, importLeads|Yes — scoped to org|
|Deals|deals, deal, createDeal, updateDeal, moveDeal, deleteDeal|Yes — scoped to org|
|Workflows|workflows, createWorkflow, updateWorkflow, toggleWorkflow|Yes — Admin+|
|Activities|activities, createActivity, completeActivity|Yes — Sales Rep+|
|Dashboard|dashboardStats, pipelineMetrics|Yes — scoped to org|
|Organisations|organisations, createOrg, updateOrg|Yes — Super Admin only|

### REST API (Secondary)

|   |   |   |
|---|---|---|
|**Method**|**Endpoint**|**Description**|
|POST|/auth/login|Email/password login — returns JWT tokens|
|POST|/auth/refresh|Exchange refresh token for new access token|
|POST|/auth/logout|Invalidate refresh token|
|POST|/webhooks/lead|Inbound lead from third-party (HMAC verified)|
|POST|/webhooks/email|SendGrid event webhook (open, click, bounce)|
|POST|/uploads/avatar|Multipart file upload for user avatar|
|GET|/health|System health check (unauthenticated)|

  

##  Security Requirements

- JWT access tokens shall be signed with RS256 (asymmetric) in production

-  HttpOnly, SameSite=Strict cookies shall be used for token storage

-  All passwords shall be hashed with bcrypt; plaintext passwords shall never be logged or stored

 - MongoDB connection strings, Redis URIs, RabbitMQ URIs, and API keys shall be stored as environment variables only
 
- CORS shall be configured to allow only explicitly listed origins

- GraphQL introspection shall be disabled in production

- GraphQL query depth and complexity limits shall be enforced to prevent DoS

- All file uploads shall be virus-scanned and stored in object storage (Cloudinary/S3), never the local filesystem

- Webhook payloads shall be verified via HMAC-SHA256 signature header

- Personal data (email, phone) shall be treated as PII; access shall be logged
## Deployment and DevOps

## Environments

|                 |                      |                                              |
| --------------- | -------------------- | -------------------------------------------- |
| **Environment** | **Infrastructure**   | **Notes**                                    |
| Development     | Local Docker Compose | MongoDB + Redis + RabbitMQ all containerised |
| Staging         | Vercel Preview       | Mirrors production; used for QA sign-off     |
| Production      | Vercel (web)         | MongoDB Atlas, Upstash Redis, CloudAMQP      |

## CI/CD Pipeline

1.     Developer pushes to feature branch
2.     GitHub Actions runs: lint, type-check, unit tests, integration tests
3.     Turborepo builds only affected packages (remote cache enabled)
4.     PR is reviewed and merged to main
5.     main merge triggers: E2E tests → build → deploy to staging
6.     Manual promotion deploys staging build to production

## TESTs:-

- system tests 
- unit test for each functions
- test for API GRAPHQL AND REST API
- CI/CD pipeline (GitHub Actions) shall run unit and integration tests on every pull request