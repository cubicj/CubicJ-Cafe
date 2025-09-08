import { PrismaClient } from '@prisma/client';

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
    console.log('✅ 데이터베이스 연결 성공');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    return false;
  }
}

// 애플리케이션 종료 시 연결 해제
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('🔌 데이터베이스 연결 해제');
}