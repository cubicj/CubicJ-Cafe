import { queueMonitor } from '@/lib/comfyui/queue-monitor';
import { initializeModelSettings } from '@/lib/database/model-settings';

// 전역 변수로 초기화 상태 추적 (Hot Reload 대응)
declare global {
  var __queueMonitorInitialized: boolean | undefined;
  var __modelSettingsInitialized: boolean | undefined;
}

export function initializeServices() {
  // Hot Reload 환경에서도 중복 초기화 방지
  if (global.__queueMonitorInitialized) {
    return;
  }

  console.log('🚀 서비스 초기화 시작...');

  try {
    // 모델 설정 초기화 (비동기)
    initializeModelSettings().catch(error => {
      console.error('❌ 모델 설정 초기화 실패:', error);
    });
    
    queueMonitor.start();
    console.log('✅ Queue Monitor 자동 시작 완료');
    
    global.__queueMonitorInitialized = true;
    global.__modelSettingsInitialized = true;
    console.log('✅ 모든 서비스 초기화 완료');
  } catch (error) {
    console.error('❌ 서비스 초기화 실패:', error);
  }
}