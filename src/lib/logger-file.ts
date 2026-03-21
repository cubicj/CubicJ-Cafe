import fs from 'fs';
import path from 'path';
import { logBuffer } from './log-buffer';

const LOG_DIR = './logs';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES_DAYS = 14;

const logDir = path.resolve(LOG_DIR);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLogFilePath(prefix: string): string {
  return path.resolve(LOG_DIR, `${prefix}-${getDateStr()}.log`);
}

function rotateIfNeeded(filePath: string): void {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > MAX_FILE_SIZE) {
      const rotated = filePath.replace('.log', `-${Date.now()}.log`);
      fs.renameSync(filePath, rotated);
    }
  } catch {
    // non-critical
  }
}

let writeQueue: Promise<void> = Promise.resolve();

export function writeLogEntry(entry: { timestamp: string; level: string; category: string; message: string; meta?: Record<string, unknown> }): void {
  const line = JSON.stringify(entry) + '\n';
  const appFile = getLogFilePath('application');
  const errorFile = getLogFilePath('error');

  writeQueue = writeQueue.then(async () => {
    try {
      rotateIfNeeded(appFile);
      await fs.promises.appendFile(appFile, line, 'utf-8');

      if (entry.level === 'error') {
        rotateIfNeeded(errorFile);
        await fs.promises.appendFile(errorFile, line, 'utf-8');
      }
    } catch {
      // file write failure
    }
  });
}

const globalForFileLogging = globalThis as unknown as { __fileLoggingInit?: boolean };

export function initFileLogging(): void {
  if (globalForFileLogging.__fileLoggingInit) return;
  globalForFileLogging.__fileLoggingInit = true;

  logBuffer.onPush((entry) => {
    writeLogEntry(entry);
  });

  setTimeout(cleanOldFiles, 5000);
}

export function cleanOldFiles(): void {
  try {
    const files = fs.readdirSync(logDir)
      .filter((f: string) => f.endsWith('.log'))
      .map((f: string) => ({ name: f, fullPath: path.join(logDir, f), mtime: fs.statSync(path.join(logDir, f)).mtimeMs }))
      .sort((a: { mtime: number }, b: { mtime: number }) => b.mtime - a.mtime);

    const cutoff = Date.now() - MAX_FILES_DAYS * 24 * 60 * 60 * 1000;
    for (const file of files) {
      if (file.mtime < cutoff) {
        fs.unlinkSync(file.fullPath);
      }
    }
  } catch {
    // non-critical
  }
}
