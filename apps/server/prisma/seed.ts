import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Feature catalogue ────────────────────────────────────────────────────────

const FEATURES = [
  { code: 'leads_management',  description: 'Create, view, edit, and delete leads'          },
  { code: 'client_management', description: 'Manage client/company records'                  },
  { code: 'analytics',         description: 'View pipeline metrics and dashboards'            },
  { code: 'email_automation',  description: 'Send and automate email campaigns'               },
  { code: 'exports',           description: 'Export data as CSV / Excel'                      },
  { code: 'automations',       description: 'Create and run workflow automations'             },
  { code: 'user_management',   description: 'Invite and manage team members'                  },
];

// ─── Default role → feature permission matrix ─────────────────────────────────
// keyed by role name → feature code → access level

const ROLE_PERMISSIONS: Record<string, Record<string, 'read' | 'write' | 'full'>> = {
  'Company Admin': {
    leads_management:  'full',
    client_management: 'full',
    analytics:         'full',
    email_automation:  'full',
    exports:           'full',
    automations:       'full',
    user_management:   'full',
  },
  'Sales Rep': {
    leads_management:  'write',
    client_management: 'read',
    analytics:         'read',
    email_automation:  'write',
    exports:           'read',
  },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding database…\n');

  // 1. Features
  console.log('  → Features');
  const featureMap: Record<string, number> = {};

  for (const f of FEATURES) {
    const feat = await prisma.feature.upsert({
      where:  { code: f.code },
      update: { description: f.description },
      create: f,
    });
    featureMap[feat.code] = feat.id;
  }

  // 2. Default Company (tenant)
  console.log('  → Company (default tenant)');
  const company = await prisma.company.upsert({
    where:  { id: 1 },
    update: {},
    create: { name: 'Acme Corp', status: 'active' },
  });

  // 3. CompanyFeature — grant ALL features to the default tenant
  console.log('  → CompanyFeature');
  for (const featureId of Object.values(featureMap)) {
    await prisma.companyFeature.upsert({
      where:  { companyId_featureId: { companyId: company.id, featureId } },
      update: {},
      create: { companyId: company.id, featureId },
    });
  }

  // 4. Roles
  console.log('  → Roles');
  const roleMap: Record<string, number> = {};

  for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where:  { companyId_name: { companyId: company.id, name: roleName } },
      update: {},
      create: { companyId: company.id, name: roleName },
    });
    roleMap[roleName] = role.id;
  }

  // 5. RolePermissions
  console.log('  → RolePermissions');
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    for (const [featureCode, accessLevel] of Object.entries(perms)) {
      const featureId = featureMap[featureCode];
      if (!featureId) continue;
      await prisma.rolePermission.upsert({
        where:  { roleId_featureId: { roleId, featureId } },
        update: { accessLevel },
        create: { roleId, featureId, accessLevel },
      });
    }
  }

  // 6. Users
  console.log('  → Users');

  const adminHash  = await bcrypt.hash('admin123!',   12);
  const repHash    = await bcrypt.hash('salesrep123!', 12);
  const superHash  = await bcrypt.hash('super123!',    12);

  // Super Admin — no companyId, no roleId
  await prisma.user.upsert({
    where:  { email: 'super@crm.internal' },
    update: {},
    create: {
      name:         'Super Admin',
      email:        'super@crm.internal',
      passwordHash: superHash,
      companyId:    null,
      roleId:       null,
      isSuperAdmin: true,
      isOwner:      false,
    },
  });

  // Company Admin (owner)
  await prisma.user.upsert({
    where:  { email: 'admin@acme.com' },
    update: {},
    create: {
      name:         'Acme Admin',
      email:        'admin@acme.com',
      passwordHash: adminHash,
      companyId:    company.id,
      roleId:       roleMap['Company Admin'],
      isSuperAdmin: false,
      isOwner:      true, // CEO / billing contact
    },
  });

  // Sales Rep
  await prisma.user.upsert({
    where:  { email: 'rep@acme.com' },
    update: {},
    create: {
      name:         'Acme Sales Rep',
      email:        'rep@acme.com',
      passwordHash: repHash,
      companyId:    company.id,
      roleId:       roleMap['Sales Rep'],
      isSuperAdmin: false,
      isOwner:      false,
    },
  });

  const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@acme.com' } });
  const repUser   = await prisma.user.findUniqueOrThrow({ where: { email: 'rep@acme.com'   } });

  // 7. Sample Client + Lead
  console.log('  → Sample Client & Lead');

  const client = await prisma.client.upsert({
    where:  { companyId_accountId: { companyId: company.id, accountId: 'ACC-SEED1' } },
    update: {},
    create: {
      accountId:     'ACC-SEED1',
      name:          'TechStart Inc.',
      industry:      'SaaS',
      website:       'https://techstart.example.com',
      employeeCount: 45,
      companyId:     company.id,
      ownerId:       adminUser.id,
    },
  });

  await prisma.lead.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      name:      'Jane Prospect',
      email:     'jane@techstart.example.com',
      phone:     '+1-555-0100',
      status:    'no_reply',
      score:     70,
      priority:  'high',
      source:    'manual',
      companyId: company.id,
      ownerId:   repUser.id,
      clientId:  client.id,
    },
  });

  // 8. Reset Auto-Increment Sequences in Postgres
  console.log('  → Syncing PostgreSQL Sequences');
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE(max(id), 1)) FROM companies;`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(max(id), 1)) FROM roles;`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('features', 'id'), COALESCE(max(id), 1)) FROM features;`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users;`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('clients', 'id'), COALESCE(max(id), 1)) FROM clients;`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('leads', 'id'), COALESCE(max(id), 1)) FROM leads;`);

  console.log('\n✅  Seeding complete.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
