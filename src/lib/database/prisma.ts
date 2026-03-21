import { PrismaClient } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('database');

// Prisma Client 싱글톤 패턴
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error'],
  });

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