import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@/generated/prisma/client';

// Prisma Client 싱글톤 패턴
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
    log: ['error'],
  });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if ((process.env.NODE_ENV || 'development') !== 'production') globalForPrisma.prisma = prisma;
