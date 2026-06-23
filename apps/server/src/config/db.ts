import { PrismaClient }        from '@prisma/client';
import { PrismaPg }            from '@prisma/adapter-pg';
import pg                      from 'pg';
import dotenv                  from 'dotenv';
import { softDeleteExtension } from '../middleware/prismaMiddleware.js';

dotenv.config();

/**
 * In Prisma 7 the datasource URL is no longer set in schema.prisma.
 * For the Prisma CLI (migrate / generate) it comes from prisma.config.ts.
 * At runtime we pass it via the PrismaPg adapter so PrismaClient knows
 * which database to connect to.
 */
const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const baseClient = new PrismaClient({ adapter });

/**
 * Extended Prisma client with soft-delete query interceptors
 * (User, Client, Lead).  Cast back to plain PrismaClient so callers
 * don't need to know about the extension type.
 */
export const prisma = baseClient.$extends(softDeleteExtension) as unknown as PrismaClient;

export const connectDB = async () => {
  try {
    await (prisma as any).$connect();
    console.log('✅  PostgreSQL connected via Prisma 7 adapter.');
  } catch (error) {
    console.error('❌  Unable to connect to the database:', error);
    process.exit(1);
  }
};
