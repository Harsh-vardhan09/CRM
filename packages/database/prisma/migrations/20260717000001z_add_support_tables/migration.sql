-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('twilio', 'email_parse');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('whatsapp', 'sms', 'email');

-- CreateTable
CREATE TABLE "integrations" (
    "id"        SERIAL             NOT NULL,
    "companyId" INTEGER            NOT NULL,
    "provider"  "IntegrationType"  NOT NULL,
    "identity"  VARCHAR(255)       NOT NULL,
    "config"    JSONB,
    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id"          SERIAL       NOT NULL,
    "companyId"   INTEGER      NOT NULL,
    "customerNum" VARCHAR(255) NOT NULL,
    "status"      TEXT         NOT NULL DEFAULT 'open',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id"        SERIAL             NOT NULL,
    "companyId" INTEGER            NOT NULL,
    "ticketId"  INTEGER,
    "leadId"    INTEGER,
    "direction" "MessageDirection" NOT NULL,
    "channel"   "MessageChannel"  NOT NULL,
    "sender"    VARCHAR(255)       NOT NULL,
    "recipient" VARCHAR(255)       NOT NULL,
    "subject"   VARCHAR(500),
    "body"      TEXT               NOT NULL,
    "createdAt" TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integrations_identity_key" ON "integrations"("identity");

-- CreateIndex
CREATE INDEX "tickets_companyId_status_idx" ON "tickets"("companyId", "status");

-- CreateIndex
CREATE INDEX "messages_companyId_idx" ON "messages"("companyId");

-- CreateIndex
CREATE INDEX "messages_ticketId_idx" ON "messages"("ticketId");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
