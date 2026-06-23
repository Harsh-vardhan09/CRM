-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('read', 'write', 'full');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('no_reply', 'contacted', 'unreachable', 'qualified', 'lost');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "CompanyStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_features" (
    "companyId" INTEGER NOT NULL,
    "featureId" INTEGER NOT NULL,
    "assignedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_features_pkey" PRIMARY KEY ("companyId","featureId")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" INTEGER NOT NULL,
    "featureId" INTEGER NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","featureId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(72) NOT NULL,
    "companyId" INTEGER,
    "roleId" INTEGER,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "avatar" VARCHAR(500),
    "refreshTokenHash" CHAR(64),
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "accountId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "industry" VARCHAR(100),
    "website" VARCHAR(500),
    "revenue" DECIMAL(18,2),
    "employeeCount" INTEGER,
    "address" VARCHAR(500),
    "description" TEXT,
    "companyId" INTEGER NOT NULL,
    "ownerId" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(30),
    "status" "LeadStatus" NOT NULL DEFAULT 'no_reply',
    "score" INTEGER NOT NULL DEFAULT 0,
    "priority" "LeadPriority" NOT NULL DEFAULT 'low',
    "notes" TEXT,
    "source" VARCHAR(100),
    "lastContactedAt" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_companyId_idx" ON "roles"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_companyId_name_key" ON "roles"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "features_code_key" ON "features"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_roleId_idx" ON "users"("companyId", "roleId");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE INDEX "clients_companyId_industry_idx" ON "clients"("companyId", "industry");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_accountId_key" ON "clients"("companyId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_name_key" ON "clients"("companyId", "name");

-- CreateIndex
CREATE INDEX "leads_companyId_status_idx" ON "leads"("companyId", "status");

-- CreateIndex
CREATE INDEX "leads_companyId_priority_idx" ON "leads"("companyId", "priority");

-- CreateIndex
CREATE INDEX "leads_companyId_ownerId_idx" ON "leads"("companyId", "ownerId");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_features" ADD CONSTRAINT "company_features_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_features" ADD CONSTRAINT "company_features_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
