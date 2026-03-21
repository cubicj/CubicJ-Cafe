import { logBuffer } from './log-buffer';

export interface CategoryLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_DEV = process.env.NODE_ENV === 'development';

const LEVEL_PRIORITY: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function isLevelEnabled(level: string): boolean {
  return (LEVEL_PRIORITY[level] ?? 99) <= (LEVEL_PRIORITY[LOG_LEVEL] ?? 2);
}

const isEdgeRuntime = typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis;
const isBrowser = typeof window !== 'undefined';
const isServer = !isEdgeRuntime && !isBrowser;

function dispatch(category: string, level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: Record<string, unknown>): void {
  if (!isLevelEnabled(level) && level !== 'error') return;

  const timestamp = new Date().toISOString();

  logBuffer.push({ timestamp, level, category, message, meta, source: 'server' });

  if (isServer && IS_DEV) {
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log;
    consoleFn(`${timestamp.slice(11, 19)} [${level.toUpperCase()}] [${category}] ${message}`, meta ?? '');
  }
}

export function createLogger(category: string): CategoryLogger {
  if (isEdgeRuntime || isBrowser) {
    return {
      info: (message, meta) => { if (isLevelEnabled('info')) console.log(`[INFO] [${category}] ${message}`, meta ?? ''); },
      warn: (message, meta) => { if (isLevelEnabled('warn')) console.warn(`[WARN] [${category}] ${message}`, meta ?? ''); },
      error: (message, meta) => { console.error(`[ERROR] [${category}] ${message}`, meta ?? ''); },
      debug: (message, meta) => { if (isLevelEnabled('debug')) console.debug(`[DEBUG] [${category}] ${message}`, meta ?? ''); },
    };
  }

  return {
    info: (message, meta) => dispatch(category, 'info', message, meta),
    warn: (message, meta) => dispatch(category, 'warn', message, meta),
    error: (message, meta) => dispatch(category, 'error', message, meta),
    debug: (message, meta) => dispatch(category, 'debug', message, meta),
  };
}

class BackwardCompatLogger {
  private log = createLogger('app');

  info(message: string, meta?: object): void {
    this.log.info(message, meta as Record<string, unknown>);
  }

  warn(message: string, meta?: object): void {
    this.log.warn(message, meta as Record<string, unknown>);
  }

  error(message: string, error?: Error | object): void {
    if (error instanceof Error) {
      this.log.error(message, {
        error: { name: error.name, message: error.message, stack: error.stack },
      });
    } else {
      this.log.error(message, error as Record<string, unknown>);
    }
  }

  debug(message: string, meta?: object): void {
    this.log.debug(message, meta as Record<string, unknown>);
  }

  verbose(message: string, meta?: object): void {
    this.log.debug(message, meta as Record<string, unknown>);
  }

  http(message: string, meta?: object): void {
    this.log.info(message, meta as Record<string, unknown>);
  }

  logApiRequest(req: { method: string; url: string; ip?: string; userAgent?: string }): void {
    this.log.info('API Request', {
      method: req.method, url: req.url, ip: req.ip, userAgent: req.userAgent,
    });
  }

  logApiResponse(req: { method: string; url: string }, res: { statusCode: number }, responseTime: number): void {
    this.log.info('API Response', {
      method: req.method, url: req.url, statusCode: res.statusCode, responseTime: `${responseTime}ms`,
    });
  }

  logError(error: Error, context?: string): void {
    this.error(`${context ? `[${context}] ` : ''}${error.message}`, error);
  }

  logDiscordEvent(event: string, data?: object): void {
    this.log.info(`Discord Event: ${event}`, data as Record<string, unknown>);
  }

  logComfyUIEvent(event: string, data?: object): void {
    this.log.info(`ComfyUI Event: ${event}`, data as Record<string, unknown>);
  }

  logGenerationEvent(event: string, data?: object): void {
    this.log.info(`Generation Event: ${event}`, data as Record<string, unknown>);
  }

  logSystemMetrics(metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    loadAverage?: number[];
    diskUsage?: { used: number; total: number };
  }): void {
    this.log.info('System Metrics', {
      memory: {
        rss: `${Math.round(metrics.memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(metrics.memoryUsage.external / 1024 / 1024)}MB`,
      },
      uptime: `${Math.round(metrics.uptime / 60)}min`,
      loadAverage: metrics.loadAverage,
      diskUsage: metrics.diskUsage
        ? {
            used: `${Math.round(metrics.diskUsage.used / 1024 / 1024 / 1024)}GB`,
            total: `${Math.round(metrics.diskUsage.total / 1024 / 1024 / 1024)}GB`,
            percentage: `${Math.round((metrics.diskUsage.used / metrics.diskUsage.total) * 100)}%`,
          }
        : undefined,
    });
  }

  getConfig() {
    return { level: LOG_LEVEL, logDir: './logs', maxFiles: '14d', maxSize: '20m' };
  }
}

export const logger = new BackwardCompatLogger();

export function createRequestLogger() {
  return (
    req: { method: string; url: string; ip?: string; connection?: { remoteAddress: string }; get: (header: string) => string },
    res: { statusCode: number; on: (event: string, callback: () => void) => void },
    next?: () => void
  ) => {
    const start = Date.now();
    logger.logApiRequest({
      method: req.method, url: req.url, ip: req.ip || req.connection?.remoteAddress, userAgent: req.get('User-Agent'),
    });
    res.on('finish', () => {
      logger.logApiResponse(req, res, Date.now() - start);
    });
    if (next) next();
  };
}

export default logger;
