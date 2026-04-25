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

const REDACTED = '[REDACTED]';
const TRUNCATED = '[TRUNCATED]';
const SENSITIVE_KEY = /(token|secret|password|authorization|cookie|session|api[-_]?key|client[-_]?secret)/i;
const USER_KEY = /^(userId|discordId|nickname|username|user)$/i;
const PROMPT_KEY = /prompt/i;
const VERBOSE_KEY = /(response|body|payload|error|stack)/i;

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)} ${TRUNCATED}` : value;
}

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, `Bearer ${REDACTED}`)
    .replace(/(token|secret|password|api[_-]?key)=([^&\s]+)/gi, `$1=${REDACTED}`);
}

function redactValue(key: string, value: unknown, depth = 0): unknown {
  if (depth > 4) return TRUNCATED;
  if (value === null || value === undefined) return value;

  if (SENSITIVE_KEY.test(key)) return REDACTED;

  if (typeof value === 'string') {
    const redacted = redactString(value);
    if (USER_KEY.test(key)) return REDACTED;
    if (PROMPT_KEY.test(key)) return truncate(redacted, 80);
    if (VERBOSE_KEY.test(key)) return truncate(redacted, 500);
    return truncate(redacted, 1000);
  }

  if (typeof value !== 'object') {
    if (USER_KEY.test(key)) return REDACTED;
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactValue(key, item, depth + 1));
  }

  const redacted: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
    redacted[childKey] = redactValue(childKey, childValue, depth + 1);
  }
  return redacted;
}

function redactMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  return redactValue('meta', meta) as Record<string, unknown>;
}

export function redactLogEntry<T extends { message: string; meta?: Record<string, unknown> }>(entry: T): T {
  return {
    ...entry,
    message: truncate(redactString(entry.message), 1000),
    meta: redactMeta(entry.meta),
  };
}

function dispatch(category: string, level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: Record<string, unknown>): void {
  if (!isLevelEnabled(level) && level !== 'error') return;

  const timestamp = new Date().toISOString();
  const redacted = redactLogEntry({ message, meta });

  logBuffer.push({ timestamp, level, category, message: redacted.message, meta: redacted.meta, source: 'server' });

  if (isServer && IS_DEV) {
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log;
    consoleFn(`${timestamp.slice(11, 19)} [${level.toUpperCase()}] [${category}] ${redacted.message}`, redacted.meta ?? '');
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
  clientBuffer.push(redactLogEntry(entry));
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
        const redacted = redactLogEntry({ message, meta });
        console.log(`[INFO] [${category}] ${redacted.message}`, redacted.meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'info', category, message: redacted.message, meta: redacted.meta });
      },
      warn: (message, meta) => {
        if (!isLevelEnabled('warn')) return;
        const redacted = redactLogEntry({ message, meta });
        console.warn(`[WARN] [${category}] ${redacted.message}`, redacted.meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'warn', category, message: redacted.message, meta: redacted.meta });
      },
      error: (message, meta) => {
        const redacted = redactLogEntry({ message, meta });
        console.error(`[ERROR] [${category}] ${redacted.message}`, redacted.meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'error', category, message: redacted.message, meta: redacted.meta });
      },
      debug: (message, meta) => {
        if (!isLevelEnabled('debug')) return;
        const redacted = redactLogEntry({ message, meta });
        console.debug(`[DEBUG] [${category}] ${redacted.message}`, redacted.meta ?? '');
        pushToClientBuffer({ timestamp: new Date().toISOString(), level: 'debug', category, message: redacted.message, meta: redacted.meta });
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
