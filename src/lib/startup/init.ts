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

  console.log('🚀 Initializing services...');

  try {
    // 모델 설정 초기화 (비동기)
    initializeModelSettings().catch(error => {
      console.error('❌ Failed to initialize model settings:', error);
    });
    
    queueMonitor.start();
    console.log('✅ Queue Monitor auto-started');
    
    global.__queueMonitorInitialized = true;
    global.__modelSettingsInitialized = true;
    console.log('✅ All services initialized');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }
}