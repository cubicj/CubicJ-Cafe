import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '@/lib/logger';

const log = createLogger('system');

export interface CleanupResult {
  deletedFiles: number;
  totalSize: number;
  errors: string[];
}

export async function cleanupTempFiles(
  maxAgeHours: number = 24,
  tempDir: string = 'public/temp'
): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedFiles: 0,
    totalSize: 0,
    errors: []
  };

  try {
    const fullTempDir = join(process.cwd(), tempDir);
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    log.info('Temp file cleanup started', { tempDir, maxAgeHours });

    const files = await readdir(fullTempDir);

    for (const file of files) {
      try {
        const filePath = join(fullTempDir, file);
        const stats = await stat(filePath);

        if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
          await unlink(filePath);
          result.deletedFiles++;
          result.totalSize += stats.size;
          log.info('Deleted temp file', { file, size: stats.size });
        }
      } catch (fileError) {
        const errorMsg = `파일 처리 실패: ${file} - ${fileError}`;
        result.errors.push(errorMsg);
        log.warn('File processing failed', { file, error: String(fileError) });
      }
    }

    log.info('Temp file cleanup complete', { deletedFiles: result.deletedFiles, totalSize: result.totalSize });

  } catch (error) {
    const errorMsg = `임시 파일 정리 실패: ${error}`;
    result.errors.push(errorMsg);
    log.error('Temp file cleanup failed', { error: String(error) });
  }

  return result;
}

export async function scheduleFileCleanup(
  filePath: string,
  delayMinutes: number = 60
): Promise<void> {
  setTimeout(async () => {
    try {
      await unlink(filePath);
      log.info('Scheduled file deletion complete', { filePath });
    } catch (error) {
      log.warn('Scheduled file deletion failed', { filePath, error: String(error) });
    }
  }, delayMinutes * 60 * 1000);
}
