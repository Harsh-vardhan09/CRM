import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL Connection has been established successfully via Prisma.');
  } catch (error) {
    console.error('Unable to connect to the database via Prisma:', error);
    process.exit(1);
  }
};
