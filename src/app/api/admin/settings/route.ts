import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { prisma } from '@/lib/database/prisma';
import { initializeDefaultSettings } from '@/lib/database/system-settings';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    let settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    if (settings.length === 0) {
      await initializeDefaultSettings();
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

    return settingsMap;
  }
);

export const PUT = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    let key, value, type = 'string', category = 'general';
    try {
      const requestText = await req.text();
      if (!requestText || requestText.trim() === '') {
        throw new Error('빈 요청 본문입니다.');
      }
      const parsedBody = JSON.parse(requestText);
      ({ key, value, type = 'string', category = 'general' } = parsedBody);
    } catch (parseError) {
      log.error('Request JSON parse error', { error: parseError instanceof Error ? parseError.message : String(parseError) });
      return NextResponse.json(
        { error: '잘못된 JSON 형식입니다.' },
        { status: 400 }
      );
    }

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

    return {
      message: '설정이 업데이트되었습니다.',
      setting
    };
  }
);

export const DELETE = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const { searchParams } = new URL(req.url);
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

    return { message: '설정이 삭제되었습니다.' };
  }
);
