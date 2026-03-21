import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { sessionManager } from '@/lib/auth/session';
import { isComfyUIEnabled, setComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { queueMonitor } from '@/lib/comfyui/queue-monitor';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function GET(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    return NextResponse.json({
      enabled: isComfyUIEnabled(),
      queueMonitor: queueMonitor.getStatus()
    });
  } catch (error) {
    log.error('ComfyUI toggle GET error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { enabled } = await request.json();
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled 값은 boolean이어야 합니다.' }, { status: 400 });
    }

    if (enabled) {
      await setComfyUIEnabled(true);
      queueMonitor.start();
    } else {
      queueMonitor.stop();
      await setComfyUIEnabled(false);
    }

    log.info('ComfyUI toggled by admin', { enabled, admin: session.user.discordId });

    return NextResponse.json({
      enabled: isComfyUIEnabled(),
      queueMonitor: queueMonitor.getStatus()
    });
  } catch (error) {
    log.error('ComfyUI toggle POST error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
