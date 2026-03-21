import { setupGlobalErrorHandlers } from './lib/error-handler';
import { createLogger } from './lib/logger';

const log = createLogger('system');

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initFileLogging } = await import('./lib/logger-file');
    initFileLogging();

    log.info('Server starting: setting up global error handlers');
    setupGlobalErrorHandlers();
  }
}
