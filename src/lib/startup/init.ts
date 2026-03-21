import { queueMonitor } from '@/lib/comfyui/queue-monitor';
import { initializeModelSettings } from '@/lib/database/model-settings';
import { createLogger } from '@/lib/logger';

const log = createLogger('system');

declare global {
  var __queueMonitorInitialized: boolean | undefined;
  var __modelSettingsInitialized: boolean | undefined;
}

export function initializeServices() {
  if (global.__queueMonitorInitialized) {
    return;
  }

  log.info('Initializing services');

  try {
    initializeModelSettings().catch(error => {
      log.error('Failed to initialize model settings', { error: error instanceof Error ? error.message : String(error) });
    });

    queueMonitor.start();
    log.info('Queue Monitor auto-started');

    global.__queueMonitorInitialized = true;
    global.__modelSettingsInitialized = true;
    log.info('All services initialized');
  } catch (error) {
    log.error('Service initialization failed', { error: error instanceof Error ? error.message : String(error) });
  }
}
