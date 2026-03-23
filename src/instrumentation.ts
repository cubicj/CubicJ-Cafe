import { setupGlobalErrorHandlers } from './lib/error-handler';
import { createLogger } from './lib/logger';

const log = createLogger('system');

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initFileLogging } = await import('./lib/logger-file');
    initFileLogging();

    const { mkdirSync } = await import('fs');
    const { join } = await import('path');
    const tempDir = join(process.cwd(), 'public', 'temp');
    mkdirSync(tempDir, { recursive: true });

    const { queueService } = await import('./lib/database/queue');
    const stats = await queueService.getQueueStats();

    if (stats.processing > 0) {
      try {
        const { comfyUIClient } = await import('./lib/comfyui/client');
        await comfyUIClient.interruptProcessing();
        log.info('ComfyUI interrupt sent for orphaned jobs');
      } catch {
        log.warn('ComfyUI interrupt failed (server may be offline), proceeding with reset');
      }

      const result = await queueService.resetProcessingToPending();
      log.info(`Recovered ${result.count} orphaned PROCESSING jobs to PENDING`);
    }

    log.info('Server starting: setting up global error handlers');
    setupGlobalErrorHandlers();
  }
}
