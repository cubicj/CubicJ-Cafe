// Next.js instrumentation file - 서버 시작 시 실행됨
import { setupGlobalErrorHandlers } from './lib/error-handler';

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 서버 시작: 전역 에러 핸들러 설정 중...');
    setupGlobalErrorHandlers();
  }
}