import { NextRequest, NextResponse } from 'next/server';
import { cleanupTempFiles } from '@/lib/utils/file-cleanup';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxAgeHours = 24 } = body;

    console.log(`수동 임시 파일 정리 요청 - ${maxAgeHours}시간 이전 파일`);

    const result = await cleanupTempFiles(maxAgeHours);

    return NextResponse.json({
      success: true,
      result,
      message: `${result.deletedFiles}개 파일 정리 완료 (${result.totalSize}바이트)`
    });

  } catch (error) {
    console.error('임시 파일 정리 실패:', error);
    return NextResponse.json(
      { error: 'File cleanup failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('자동 임시 파일 정리 시작');
    
    const result = await cleanupTempFiles(1);

    return NextResponse.json({
      success: true,
      result,
      message: `자동 정리 완료: ${result.deletedFiles}개 파일 삭제`
    });

  } catch (error) {
    console.error('자동 임시 파일 정리 실패:', error);
    return NextResponse.json(
      { error: 'Auto cleanup failed' },
      { status: 500 }
    );
  }
}