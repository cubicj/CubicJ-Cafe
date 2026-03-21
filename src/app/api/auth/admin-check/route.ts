import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/database/sessions';
import { isAdmin } from '@/lib/auth/admin';

import { createLogger } from '@/lib/logger';

const log = createLogger('auth');

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const adminStatus = isAdmin(session.user.discordId);
    if (!adminStatus) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    log.error('Admin check error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}