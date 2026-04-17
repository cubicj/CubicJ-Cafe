import { setupGlobalErrorHandlers } from './lib/error-handler';
import { createLogger } from './lib/logger';

const log = createLogger('system');

function validateEnv() {
  const errors: string[] = [];

  const critical = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DATABASE_URL',
    'COMFYUI_API_URL',
  ] as const;

  for (const name of critical) {
    if (!process.env[name]) {
      errors.push(name);
    }
  }

  if (!process.env.APP_URL) {
    errors.push('APP_URL');
  } else {
    try {
      new URL(process.env.APP_URL);
    } catch {
      errors.push('APP_URL (invalid URL format)');
    }
  }

  if (errors.length > 0) {
    for (const err of errors) {
      log.error(`Missing or invalid required env var: ${err}`);
    }
    throw new Error(`Missing required env vars: ${errors.join(', ')}`);
  }

  const optional = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_GUILD_ID',
    'DISCORD_CHANNEL_ID',
  ] as const;

  for (const name of optional) {
    if (!process.env[name]) {
      log.warn(`Optional env var missing: ${name}`);
    }
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnv();

    const { loadOpsSettings } = await import('./lib/database/ops-settings');
    await loadOpsSettings();

    const { generationStore } = await import('./lib/generation-store');
    generationStore.startSweep();

    const { initFileLogging } = await import('./lib/logger-file');
    initFileLogging();

    const { mkdirSync } = await import('fs');
    const { join } = await import('path');
    const tempDir = join(process.cwd(), 'public', 'temp');
    mkdirSync(tempDir, { recursive: true });

    const { QueueService } = await import('./lib/database/queue');
    const stats = await QueueService.getQueueStats();

    if (stats.processing > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        await fetch(`${process.env.COMFYUI_API_URL}/interrupt`, {
          method: 'POST',
          body: '{}',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        log.info('ComfyUI interrupt sent for orphaned jobs');
      } catch {
        log.warn('ComfyUI interrupt failed (server may be offline), proceeding with reset');
      }

      const result = await QueueService.resetStaleProcessingRequests();
      log.info(`Recovered ${result.count} orphaned PROCESSING requests to PENDING`);
    }

    log.info('Server starting: setting up global error handlers');
    setupGlobalErrorHandlers();
  }
}
