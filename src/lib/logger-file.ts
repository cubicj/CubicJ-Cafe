import fs from 'fs';
import path from 'path';
import { logBuffer } from './log-buffer';
import { getOpsSetting } from './database/ops-settings';

const LOG_DIR = process.env.LOG_DIR || './logs';

const logDir = path.resolve(/* turbopackIgnore: true */ LOG_DIR);
if (!fs.existsSync(/* turbopackIgnore: true */ logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLogFilePath(prefix: string): string {
  return path.resolve(LOG_DIR, `${prefix}-${getDateStr()}.log`);
}

const trackedFileSizes = new Map<string, number>();

function rotateIfNeeded(filePath: string): void {
  const hadTrackedSize = trackedFileSizes.has(filePath);
  let size = trackedFileSizes.get(filePath);

  try {
    if (size === undefined) {
      size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    }

    const maxFileSize = getOpsSetting('ops.log_file_max_bytes');
    if (size > maxFileSize) {
      if (hadTrackedSize) {
        size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      }

      if (size <= maxFileSize) {
        trackedFileSizes.set(filePath, size);
        return;
      }

      const rotated = filePath.replace('.log', `-${Date.now()}.log`);
      fs.renameSync(filePath, rotated);
      size = 0;
    }
  } catch {
    // non-critical
  }

  trackedFileSizes.set(filePath, size ?? 0);
}

let writeQueue: Promise<void> = Promise.resolve();

function writeLogEntry(entry: { timestamp: string; level: string; category: string; message: string; meta?: Record<string, unknown> }): void {
  const line = JSON.stringify(entry) + '\n';
  const lineBytes = Buffer.byteLength(line, 'utf-8');
  const appFile = getLogFilePath('application');
  const errorFile = getLogFilePath('error');

  writeQueue = writeQueue.then(async () => {
    try {
      rotateIfNeeded(appFile);
      await fs.promises.appendFile(appFile, line, 'utf-8');
      trackedFileSizes.set(appFile, (trackedFileSizes.get(appFile) ?? 0) + lineBytes);

      if (entry.level === 'error') {
        rotateIfNeeded(errorFile);
        await fs.promises.appendFile(errorFile, line, 'utf-8');
        trackedFileSizes.set(errorFile, (trackedFileSizes.get(errorFile) ?? 0) + lineBytes);
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

function cleanOldFiles(): void {
  try {
    const files = fs.readdirSync(/* turbopackIgnore: true */ logDir)
      .filter((f: string) => f.endsWith('.log'))
      .map((f: string) => ({ name: f, fullPath: path.join(/* turbopackIgnore: true */ logDir, f), mtime: fs.statSync(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ logDir, f)).mtimeMs }))
      .sort((a: { mtime: number }, b: { mtime: number }) => b.mtime - a.mtime);

    const cutoff = Date.now() - getOpsSetting('ops.log_file_retention_days') * 24 * 60 * 60 * 1000;
    for (const file of files) {
      if (file.mtime < cutoff) {
        fs.unlinkSync(file.fullPath);
      }
    }
  } catch {
    // non-critical
  }
}
