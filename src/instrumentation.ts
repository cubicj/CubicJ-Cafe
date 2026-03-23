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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        await fetch(`${process.env.COMFYUI_API_URL || 'http://localhost:8188'}/interrupt`, {
          method: 'POST',
          body: '{}',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
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
