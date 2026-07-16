# CRM — Docker Setup Guide

A multi-tenant CRM built as a monorepo (Turborepo + pnpm):

| Service | What it does | Port |
|---|---|---|
| `server` | Express API (auth, admin, leads, support) | 5000 |
| `web` | Next.js frontend | 3000 |
| `workers` | Background jobs (WhatsApp/email sending & receiving) | — |
| `db` | PostgreSQL 16 | 5432 |
| `redis` | Redis (queues, cache) | 6379 |
| `adminer` | Web UI to browse the database | 8080 |

All three apps (`server`, `web`, `workers`) are built and run from **one** Docker image (the root `Dockerfile`), started together by `docker-compose.yaml`.

---

## 1. Prerequisites

- Docker + Docker Compose installed
- Nothing else — no local Node.js/pnpm needed, it all runs inside the container.

---

## 2. Set up environment files

The app reads its config from a folder called `env/` (git-ignored). Copy the examples and fill in real values:

```bash
mkdir env
cp env.example/postgres.env.example env/postgres.env
cp env.example/root.env.example      env/root.env
cp env.example/server.env.example    env/server.env
cp env.example/web.env.example       env/web.env
cp env.example/worker.env.example    env/worker.env
```

Then edit each file:

- **`env/postgres.env`** — set `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (e.g. `crm`).
- **`env/root.env`** — set the same Postgres credentials again, plus:
  - `DATABASE_URL=postgres://<user>:<password>@db:5432/crm` (use `db` as the host — that's the Postgres service name in Compose)
  - `JWT_SECRET=<any long random string>`
- **`env/server.env`** — usually fine as-is (`PORT=5000`).
- **`env/web.env`** — `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- **`env/worker.env`** — add real `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `RESEND_API_KEY` if you want WhatsApp/email sending to actually work (otherwise the worker just stays idle for those features).

Also create a root `.env` (used directly by `docker-compose.yaml`'s `environment:` block):

```bash
cp .env.example .env
```
and fill in `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD` there too (same values as above).

---

## 3. Build and run

From the repo root:

```bash
docker compose up --build
```

That single command will:
1. Build the app image (installs dependencies, generates the Prisma client, compiles server/web/worker).
2. Start Postgres, Redis, and Adminer.
3. Wait for Postgres to be ready.
4. Apply the database schema (migrations, or `prisma db push` if no migrations exist yet).
5. Start the server, web app, and worker together in one container.
6. Auto-seed demo data — a "Demo Company" with test accounts:

   | Email | Password | Role |
   |---|---|---|
   | `superadmin@crm.com` | `super123` | Super Admin |
   | `admin@crm.com` | `admin123` | Admin |
   | `sales@crm.com` | `sales123` | Sales Rep |

Run it in the background instead with:

```bash
docker compose up --build -d
```

---

## 4. Access it

- Web app: **http://localhost:3000**
- API health check: **http://localhost:5000/api/health**
- Adminer (DB browser): **http://localhost:8080**
  - System: `PostgreSQL`, Server: `db`, Username/Password: from `env/postgres.env`, Database: your `POSTGRES_DB`

---

## 5. Common commands

```bash
# Stop everything
docker compose down

# Stop and wipe the database volume too (fresh start)
docker compose down -v

# Rebuild after changing code/dependencies
docker compose up --build

# View logs
docker compose logs -f app

# Rebuild just the image without starting containers
docker build -t crm-app .
```

---

## 6. Troubleshooting

- **"role/database does not exist"** → double-check `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` match between `env/postgres.env`, `env/root.env`, and the root `.env`.
- **Web can't reach the API** → confirm `NEXT_PUBLIC_API_URL` in `env/web.env` points to `http://localhost:5000/api`.
- **Changed the Prisma schema?** → rebuild (`docker compose up --build`); the container regenerates the client and applies the schema on every start.