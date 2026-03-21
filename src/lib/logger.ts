import { logBuffer } from './log-buffer';

export interface CategoryLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}

const isEdgeRuntime = typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis;
const isBrowser = typeof window !== 'undefined';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = './logs';
const MAX_FILES = '14d';
const MAX_SIZE = '20m';
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

function makeConsoleFallback(category: string): CategoryLogger {
  return {
    info: (message, meta) => {
      if (!isLevelEnabled('info')) return;
      console.log(`[INFO] [${category}] ${message}`, meta ?? '');
    },
    warn: (message, meta) => {
      if (!isLevelEnabled('warn')) return;
      console.warn(`[WARN] [${category}] ${message}`, meta ?? '');
    },
    error: (message, meta) => {
      console.error(`[ERROR] [${category}] ${message}`, meta ?? '');
    },
    debug: (message, meta) => {
      if (!isLevelEnabled('debug')) return;
      console.debug(`[DEBUG] [${category}] ${message}`, meta ?? '');
    },
  };
}

interface QueuedEntry {
  level: string;
  message: string;
  meta?: Record<string, unknown>;
}

interface WinstonInstance {
  info: (message: string, meta?: object) => void;
  warn: (message: string, meta?: object) => void;
  error: (message: string, meta?: object) => void;
  debug: (message: string, meta?: object) => void;
}

let winstonInstance: WinstonInstance | null = null;
let winstonReady = false;
const earlyQueue: Array<{ category: string; entry: QueuedEntry }> = [];

async function initWinston(): Promise<void> {
  try {
    const { default: winston } = await import('winston');
    const { default: DailyRotateFile } = await import('winston-daily-rotate-file');
    const { join } = await import('path');

    const WinstonTransport = (winston as unknown as { Transport: new (opts?: object) => { log?: (info: unknown, cb: () => void) => void; emit: (event: string, info: unknown) => void } }).Transport;
    class BufferTransport extends (WinstonTransport as unknown as new (opts?: object) => object) {
      log(info: Record<string, unknown>, callback: () => void): void {
        setImmediate(() => (this as unknown as { emit: (event: string, info: unknown) => void }).emit('logged', info));
        logBuffer.push({
          timestamp: (info.timestamp as string) || new Date().toISOString(),
          level: (info.level as string) || 'info',
          category: (info.category as string) || 'app',
          message: info.message as string,
          meta: info.meta as Record<string, unknown> | undefined,
        });
        callback();
      }
    }

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf((info: Record<string, unknown>) => {
        const ts = info.timestamp as string;
        const level = info.level as string;
        const category = info.category as string;
        const message = info.message as string;
        return `${ts} [${level}] [${category}] ${message}`;
      })
    );

    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports = [
      new BufferTransport(),
      new DailyRotateFile({
        filename: join(LOG_DIR, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: MAX_FILES,
        maxSize: MAX_SIZE,
        format: fileFormat,
      }),
      new DailyRotateFile({
        level: 'error',
        filename: join(LOG_DIR, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: MAX_FILES,
        maxSize: MAX_SIZE,
        format: fileFormat,
      }),
    ];

    if (IS_DEV) {
      transports.push(
        new winston.transports.Console({ format: consoleFormat }) as never
      );
    }

    winstonInstance = winston.createLogger({
      level: LOG_LEVEL,
      transports: transports as never[],
      exitOnError: false,
    });

    winstonReady = true;

    for (const { category, entry } of earlyQueue) {
      winstonInstance[entry.level as 'info' | 'warn' | 'error' | 'debug'](entry.message, {
        category,
        meta: entry.meta,
      });
    }
    earlyQueue.length = 0;
  } catch {
    winstonReady = true;
    earlyQueue.length = 0;
  }
}

if (!isEdgeRuntime && !isBrowser) {
  initWinston();
}

export function createLogger(category: string): CategoryLogger {
  if (isEdgeRuntime || isBrowser) {
    return makeConsoleFallback(category);
  }

  const dispatch = (level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: Record<string, unknown>) => {
    if (winstonReady && winstonInstance) {
      winstonInstance[level](message, { category, meta });
    } else {
      earlyQueue.push({ category, entry: { level, message, meta } });
      const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log;
      const ts = new Date().toTimeString().slice(0, 8);
      consoleFn(`${ts} [${level}] [${category}] ${message}`, meta ?? '');
    }
  };

  return {
    info: (message, meta) => dispatch('info', message, meta),
    warn: (message, meta) => dispatch('warn', message, meta),
    error: (message, meta) => dispatch('error', message, meta),
    debug: (message, meta) => dispatch('debug', message, meta),
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
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  logApiResponse(req: { method: string; url: string }, res: { statusCode: number }, responseTime: number): void {
    this.log.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
    });
  }

  getConfig() {
    return { level: LOG_LEVEL, logDir: LOG_DIR, maxFiles: MAX_FILES, maxSize: MAX_SIZE };
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
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
    });
    res.on('finish', () => {
      logger.logApiResponse(req, res, Date.now() - start);
    });
    if (next) next();
  };
}

export default logger;
