import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/database/prisma';
import { QueueStatus } from '@/generated/prisma/enums';
import { createLogger } from '@/lib/logger';

const log = createLogger('system');

interface CleanupResult {
  deletedFiles: number;
  skippedFiles: number;
  totalSize: number;
  errors: string[];
}

async function getActiveQueueFileNames(): Promise<Set<string>> {
  const activeRequests = await prisma.queueRequest.findMany({
    where: { status: { in: [QueueStatus.PENDING, QueueStatus.PROCESSING] } },
    select: { imageFile: true, endImageFile: true }
  });
  const names = new Set<string>();
  for (const req of activeRequests) {
    if (req.imageFile) names.add(req.imageFile);
    if (req.endImageFile) names.add(req.endImageFile);
  }
  return names;
}

export async function cleanupTempFiles(
  maxAgeHours: number = 24,
  tempDir: string = process.env.UPLOAD_TEMP_DIR || './public/temp'
): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedFiles: 0,
    skippedFiles: 0,
    totalSize: 0,
    errors: []
  };

  try {
    const fullTempDir = join(/* turbopackIgnore: true */ process.cwd(), tempDir);
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const activeFiles = await getActiveQueueFileNames();

    log.debug('Temp file cleanup started', { tempDir, maxAgeHours, activeFiles: activeFiles.size });

    const files = await readdir(/* turbopackIgnore: true */ fullTempDir);

    for (const file of files) {
      try {
        if (activeFiles.has(file)) {
          result.skippedFiles++;
          continue;
        }

        const filePath = join(/* turbopackIgnore: true */ fullTempDir, file);
        const stats = await stat(filePath);

        if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
          await unlink(filePath);
          result.deletedFiles++;
          result.totalSize += stats.size;
        }
      } catch (fileError) {
        const errorMsg = `파일 처리 실패: ${file} - ${fileError}`;
        result.errors.push(errorMsg);
        log.warn('File processing failed', { file, error: String(fileError) });
      }
    }

    log.info('Temp file cleanup complete', {
      deletedFiles: result.deletedFiles,
      skippedFiles: result.skippedFiles,
      totalSize: result.totalSize
    });

  } catch (error) {
    const errorMsg = `임시 파일 정리 실패: ${error}`;
    result.errors.push(errorMsg);
    log.error('Temp file cleanup failed', { error: String(error) });
  }

  return result;
}
