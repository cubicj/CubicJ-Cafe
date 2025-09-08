// 전역 에러 핸들러
export function setupGlobalErrorHandlers(): void {
  // unhandledRejection 핸들러 (Discord Bot 에러 등)
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Discord 관련 에러는 로그만 남기고 프로세스를 중단하지 않음
    if (reason && typeof reason === 'object' && 'message' in reason) {
      const message = String((reason as { message?: unknown }).message);
      if (message.includes('handle') || message.includes('Discord') || message.includes('MESSAGE_CREATE')) {
        console.warn('⚠️ Discord 관련 에러가 감지되었지만 프로세스를 계속 진행합니다.');
        return;
      }
    }
    
    // 다른 중요한 에러는 로그만 남기고 계속 진행
    console.error('📝 에러가 발생했지만 프로세스를 계속 진행합니다.');
  });

  // uncaughtException 핸들러
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    
    // Discord 관련 에러는 로그만 남기고 프로세스를 중단하지 않음
    if (error.message.includes('handle') || error.message.includes('Discord') || error.message.includes('MESSAGE_CREATE')) {
      console.warn('⚠️ Discord 관련 uncaught exception이 감지되었지만 프로세스를 계속 진행합니다.');
      return;
    }
    
    // 다른 중요한 에러도 로그만 남기고 계속 진행 (프로덕션 안정성을 위해)
    console.error('📝 Uncaught exception이 발생했지만 프로세스를 계속 진행합니다.');
  });

  console.log('✅ 전역 에러 핸들러가 설정되었습니다.');
}