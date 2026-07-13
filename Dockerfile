# Dockerfile  (root of the monorepo)
#
# Self-contained: docker compose up --build is the only command needed.
# No local Node/pnpm/turbo, no manual migration step — the wait/migrate/start
# logic below runs inline on container start, no separate script file.

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl postgresql-client
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# ---- Install (cached unless manifests change) ----
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/workers/package.json apps/workers/package.json
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @repo/db exec prisma --version

# ---- Full source ----
COPY . .

# tsx runs the worker's TypeScript directly (see apps/workers/package.json's
# "start" script) — installed globally so it doesn't touch the lockfile.
# RUN pnpm add -g tsx

# Generate the Prisma client for the shared @repo/db package.
# NOTE: adjust the --schema path if your schema.prisma lives elsewhere.
RUN pnpm --filter=@repo/db exec prisma generate --schema=./prisma/schema.prisma

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Compiles server (tsc -b) and web (next build)
RUN pnpm turbo run build \
    --filter=@repo/db \
    --filter=server \
    --filter=workers \
    --filter=web

ENV NODE_ENV=production
EXPOSE 3000 5000

# Wait for Postgres, apply the schema, then start server+web+worker together.
CMD sh -c '\
    echo "Waiting for Postgres at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..." && \
    until pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; do sleep 1; done && \
    echo "Postgres is ready." && \
    if [ -d "packages/database/prisma/migrations" ] && [ "$(ls -A packages/database/prisma/migrations 2>/dev/null)" ]; then \
    pnpm --filter=@repo/db exec prisma migrate deploy --schema=./prisma/schema.prisma; \
    else \
    echo "No migrations found — using prisma db push instead"; \
    pnpm --filter=@repo/db exec prisma db push --schema=./prisma/schema.prisma; \
    fi && \
    echo "Starting server + web + worker..." && \
    exec pnpm turbo run start \
    '