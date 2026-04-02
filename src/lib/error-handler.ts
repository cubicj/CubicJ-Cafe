import { createLogger } from '@/lib/logger';

const log = createLogger('system');

const DISCORD_ERROR_PATTERNS = [
  'DiscordAPIError',
  'MESSAGE_CREATE',
  'discord.js',
  'InteractionAlreadyReplied',
  'Unknown interaction',
  'Unknown Message',
];

function isDiscordRelatedError(message: string): boolean {
  return DISCORD_ERROR_PATTERNS.some(pattern => message.includes(pattern));
}

export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection', { promise: String(promise), reason: String(reason) });

    if (reason && typeof reason === 'object' && 'message' in reason) {
      const message = String((reason as { message?: unknown }).message);
      if (isDiscordRelatedError(message)) {
        log.warn('Discord-related error suppressed', { message });
        return;
      }
    }

    log.error('Error occurred but continuing process');
  });

  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception', { error: error.message, stack: error.stack });

    if (isDiscordRelatedError(error.message)) {
      log.warn('Discord-related uncaught exception suppressed', { message: error.message });
      return;
    }

    log.error('Non-Discord uncaught exception, shutting down');
    process.exit(1);
  });

  log.info('Global error handlers configured');
}
