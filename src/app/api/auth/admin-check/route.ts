import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';

import { createLogger } from '@/lib/logger';

const log = createLogger('auth');

export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      return NextResponse.json({ isAdmin: true });
    } catch (error) {
      log.error('Admin check error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
  });
}
