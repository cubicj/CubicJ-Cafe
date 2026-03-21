// Next.js instrumentation file - 서버 시작 시 실행됨
import { setupGlobalErrorHandlers } from './lib/error-handler';

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server starting: setting up global error handlers...');
    setupGlobalErrorHandlers();
  }
}