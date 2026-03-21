import { NextRequest, NextResponse } from 'next/server';
import { cleanupTempFiles } from '@/lib/utils/file-cleanup';

import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxAgeHours = 24 } = body;

    log.info('Manual temp file cleanup request', { maxAgeHours });

    const result = await cleanupTempFiles(maxAgeHours);

    return NextResponse.json({
      success: true,
      result,
      message: `${result.deletedFiles}개 파일 정리 완료 (${result.totalSize}바이트)`
    });

  } catch (error) {
    log.error('Temp file cleanup failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'File cleanup failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    log.info('Auto temp file cleanup started');
    
    const result = await cleanupTempFiles(1);

    return NextResponse.json({
      success: true,
      result,
      message: `자동 정리 완료: ${result.deletedFiles}개 파일 삭제`
    });

  } catch (error) {
    log.error('Auto temp file cleanup failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Auto cleanup failed' },
      { status: 500 }
    );
  }
}