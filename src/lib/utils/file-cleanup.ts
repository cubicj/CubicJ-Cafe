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
    
    console.log(`임시 파일 정리 시작: ${tempDir} (${maxAgeHours}시간 이전 파일)`);

    const files = await readdir(fullTempDir);
    
    for (const file of files) {
      try {
        const filePath = join(fullTempDir, file);
        const stats = await stat(filePath);
        
        if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
          await unlink(filePath);
          result.deletedFiles++;
          result.totalSize += stats.size;
          console.log(`삭제됨: ${file} (크기: ${stats.size}바이트)`);
        }
      } catch (fileError) {
        const errorMsg = `파일 처리 실패: ${file} - ${fileError}`;
        result.errors.push(errorMsg);
        console.warn(errorMsg);
      }
    }

    console.log(`임시 파일 정리 완료: ${result.deletedFiles}개 파일 삭제 (${result.totalSize}바이트)`);
    
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
      console.log(`예약된 파일 삭제 완료: ${filePath}`);
    } catch (error) {
      console.warn(`예약된 파일 삭제 실패: ${filePath} - ${error}`);
    }
  }, delayMinutes * 60 * 1000);
}