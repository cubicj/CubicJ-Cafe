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

interface ClientLogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  meta?: Record<string, unknown>;
}

let clientBuffer: ClientLogEntry[] = [];
let flushInterval: ReturnType<typeof setInterval> | null = null;
const CLIENT_BUFFER_MAX = 200;
const FLUSH_INTERVAL_MS = 3000;
const INGEST_URL = '/api/admin/logs/ingest';
const STORAGE_KEY = 'client_log_transport_enabled';

function flushClientBuffer(): void {
  if (clientBuffer.length === 0) return;

  const entries = clientBuffer.splice(0, clientBuffer.length);

  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ entries }),
  }).catch(() => {});
}

function pushToClientBuffer(entry: ClientLogEntry): void {
  if (!flushInterval) return;
  clientBuffer.push(entry);
  if (clientBuffer.length > CLIENT_BUFFER_MAX) {
    clientBuffer = clientBuffer.slice(-CLIENT_BUFFER_MAX);
  }
}

function handleBeforeUnload(): void {
  if (clientBuffer.length === 0) return;
  const blob = new Blob(
    [JSON.stringify({ entries: clientBuffer })],
    { type: 'application/json' }
  );
  navigator.sendBeacon(INGEST_URL, blob);
  clientBuffer = [];
}

let originalConsole: { log: typeof console.log; warn: typeof console.warn; error: typeof console.error; debug: typeof console.debug } | null = null;
let insideOverride = false;

function argsToString(args: unknown[]): string {
  return args.map(a => {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  }).join(' ');
}

function installConsoleOverride(): void {
  if (originalConsole) return;
  originalConsole = { log: console.log, warn: console.warn, error: console.error, debug: console.debug };

  const wrap = (level: 'info' | 'warn' | 'error' | 'debug', orig: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      orig.apply(console, args);
      if (insideOverride) return;
      insideOverride = true;
      pushToClientBuffer({ timestamp: new Date().toISOString(), level, category: 'console', message: argsToString(args) });
      insideOverride = false;
    };
  };

  console.log = wrap('info', originalConsole.log);
  console.warn = wrap('warn', originalConsole.warn);
  console.error = wrap('error', originalConsole.error);
  console.debug = wrap('debug', originalConsole.debug);
}

function uninstallConsoleOverride(): void {
  if (!originalConsole) return;
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
  originalConsole = null;
}

export function enableClientLogTransport(): void {
  if (!isBrowser || flushInterval) return;
  flushInterval = setInterval(flushClientBuffer, FLUSH_INTERVAL_MS);
  window.addEventListener('beforeunload', handleBeforeUnload);
  installConsoleOverride();
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
}

export function isClientLogTransportEnabled(): boolean {
  return flushInterval !== null;
}

export function disableClientLogTransport(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
  clientBuffer = [];
  if (isBrowser) {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
  uninstallConsoleOverride();
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function restoreClientLogTransport(): void {
  if (!isBrowser) return;
  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      enableClientLogTransport();
    }
  } catch {}
}

export function createLogger(category: string): CategoryLogger {
  if (isEdgeRuntime || isBrowser) {
    return {
      info: (message, meta) => {
        if (!isLevelEnabled('info')) return;
        console.log(`[INFO] [${category}] ${message}`, meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'info', category, message, meta });
      },
      warn: (message, meta) => {
        if (!isLevelEnabled('warn')) return;
        console.warn(`[WARN] [${category}] ${message}`, meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'warn', category, message, meta });
      },
      error: (message, meta) => {
        console.error(`[ERROR] [${category}] ${message}`, meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'error', category, message, meta });
      },
      debug: (message, meta) => {
        if (!isLevelEnabled('debug')) return;
        console.debug(`[DEBUG] [${category}] ${message}`, meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'debug', category, message, meta });
      },
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
