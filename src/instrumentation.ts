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

    log.info('Server starting: setting up global error handlers');
    setupGlobalErrorHandlers();
  }
}
