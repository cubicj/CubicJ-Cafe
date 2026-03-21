import { createLogger } from '@/lib/logger';

const log = createLogger('system');

export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection', { promise: String(promise), reason: String(reason) });

    if (reason && typeof reason === 'object' && 'message' in reason) {
      const message = String((reason as { message?: unknown }).message);
      if (message.includes('handle') || message.includes('Discord') || message.includes('MESSAGE_CREATE')) {
        log.warn('Discord-related error detected, continuing process');
        return;
      }
    }

    log.error('Error occurred but continuing process');
  });

  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception', { error: error.message, stack: error.stack });

    if (error.message.includes('handle') || error.message.includes('Discord') || error.message.includes('MESSAGE_CREATE')) {
      log.warn('Discord-related uncaught exception detected, continuing process');
      return;
    }

    log.error('Uncaught exception occurred but continuing process');
  });

  log.info('Global error handlers configured');
}
