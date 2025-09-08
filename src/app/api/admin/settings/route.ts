import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { sessionManager } from '@/lib/auth/session';
import { prisma } from '@/lib/database/prisma';
import { initializeDefaultSettings } from '@/lib/database/system-settings';
import { initializeModelSettings } from '@/lib/database/model-settings';

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

    let settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    if (settings.length === 0) {
      await initializeDefaultSettings();
      await initializeModelSettings();
      settings = await prisma.systemSetting.findMany({
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });
    }

    const settingsMap = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = {
        value: setting.value,
        type: setting.type
      };
      return acc;
    }, {} as Record<string, Record<string, { value: string; type: string }>>);

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('시스템 설정 조회 오류:', error);
    return NextResponse.json(
      { error: '시스템 설정을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { key, value, type = 'string', category = 'general' } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: '키와 값이 필요합니다.' },
        { status: 400 }
      );
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, type, category },
      create: { key, value, type, category }
    });

    return NextResponse.json({ 
      message: '설정이 업데이트되었습니다.',
      setting 
    });
  } catch (error) {
    console.error('시스템 설정 업데이트 오류:', error);
    return NextResponse.json(
      { error: '설정 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: '삭제할 설정 키가 필요합니다.' },
        { status: 400 }
      );
    }

    await prisma.systemSetting.delete({
      where: { key }
    });

    return NextResponse.json({ message: '설정이 삭제되었습니다.' });
  } catch (error) {
    console.error('시스템 설정 삭제 오류:', error);
    return NextResponse.json(
      { error: '설정 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}