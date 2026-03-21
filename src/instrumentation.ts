import { setupGlobalErrorHandlers } from './lib/error-handler';
import { createLogger } from './lib/logger';

const log = createLogger('system');

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    log.info('Server starting: setting up global error handlers');
    setupGlobalErrorHandlers();
  }
}
