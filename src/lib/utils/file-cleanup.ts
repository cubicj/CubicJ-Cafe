import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

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
    
    console.log(`Temp file cleanup started: ${tempDir} (files older than ${maxAgeHours}h)`);

    const files = await readdir(fullTempDir);
    
    for (const file of files) {
      try {
        const filePath = join(fullTempDir, file);
        const stats = await stat(filePath);
        
        if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
          await unlink(filePath);
          result.deletedFiles++;
          result.totalSize += stats.size;
          console.log(`Deleted: ${file} (size: ${stats.size} bytes)`);
        }
      } catch (fileError) {
        const errorMsg = `파일 처리 실패: ${file} - ${fileError}`;
        result.errors.push(errorMsg);
        console.warn(errorMsg);
      }
    }

    console.log(`Temp file cleanup complete: ${result.deletedFiles} files deleted (${result.totalSize} bytes)`);
    
  } catch (error) {
    const errorMsg = `임시 파일 정리 실패: ${error}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
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
      console.log(`Scheduled file deletion complete: ${filePath}`);
    } catch (error) {
      console.warn(`Scheduled file deletion failed: ${filePath} - ${error}`);
    }
  }, delayMinutes * 60 * 1000);
}