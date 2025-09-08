import { NextRequest, NextResponse } from 'next/server';
import { queueMonitor } from '@/lib/comfyui/queue-monitor';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        queueMonitor.start();
        return NextResponse.json({ 
          success: true, 
          message: 'Queue Monitor가 시작되었습니다.',
          status: queueMonitor.getStatus()
        });

      case 'stop':
        queueMonitor.stop();
        return NextResponse.json({ 
          success: true, 
          message: 'Queue Monitor가 중단되었습니다.',
          status: queueMonitor.getStatus()
        });

      case 'status':
        return NextResponse.json({ 
          success: true, 
          data: queueMonitor.getStatus()
        });

      default:
        return NextResponse.json({ 
          error: '잘못된 액션입니다. (start, stop, status 중 선택)' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Queue Monitor API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      data: queueMonitor.getStatus()
    });
  } catch (error) {
    console.error('Queue Monitor 상태 조회 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}