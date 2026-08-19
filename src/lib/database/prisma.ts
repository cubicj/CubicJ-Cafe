import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@/generated/prisma/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('database');

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

// 데이터베이스 연결 테스트
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    log.info('Database connection successful');
    return true;
  } catch (error) {
    log.error('Database connection failed', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

// 애플리케이션 종료 시 연결 해제
export async function disconnectDatabase() {
  await prisma.$disconnect();
  log.info('Database disconnected');
}
