-- CreateEnum
CREATE TYPE "LeadChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED');

-- AlterTable: Lead
ALTER TABLE "leads"
  ADD COLUMN "isActive"          BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN "originChannel"     "LeadChannel",
  ADD COLUMN "lastChannel"       "LeadChannel",
  ADD COLUMN "lastInteractionAt" TIMESTAMP(3),
  ADD COLUMN "optedOut"          BOOLEAN      NOT NULL DEFAULT false;

-- AlterTable: Message
ALTER TABLE "messages"
  ADD COLUMN "status"          "MessageStatus",
  ADD COLUMN "externalId"      VARCHAR(255),
  ADD COLUMN "providerPayload" JSONB;

-- CreateIndex
CREATE INDEX "leads_companyId_isActive_idx" ON "leads"("companyId", "isActive");
