-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('LEAD_INACTIVE');

-- CreateEnum
CREATE TYPE "AutomationAction" AS ENUM ('SEND_MESSAGE');

-- CreateTable
CREATE TABLE "automations" (
  "id"           SERIAL            NOT NULL,
  "companyId"    INTEGER           NOT NULL,
  "name"         VARCHAR(255)      NOT NULL,
  "trigger"      "AutomationTrigger" NOT NULL,
  "action"       "AutomationAction"  NOT NULL,
  "actionConfig" JSONB             NOT NULL,
  "enabled"      BOOLEAN           NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)      NOT NULL,
  CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automations_companyId_trigger_enabled_idx" ON "automations"("companyId", "trigger", "enabled");

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
