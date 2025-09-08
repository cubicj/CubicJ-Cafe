import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sessionManager } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);

    if (!sessionId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const session = await sessionManager.validateSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 });
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!table) {
      const tables = [
        { name: 'users', displayName: '사용자', count: await prisma.user.count() },
        { name: 'sessions', displayName: '세션', count: await prisma.session.count() },
        { name: 'queue_requests', displayName: '큐 요청', count: await prisma.queueRequest.count() },
        { name: 'lora_presets', displayName: 'LoRA 프리셋', count: await prisma.loRAPreset.count() },
        { name: 'lora_preset_items', displayName: 'LoRA 프리셋 아이템', count: await prisma.loRAPresetItem.count() },
      ];
      return NextResponse.json({ tables });
    }

    let data: unknown[] = [];
    let totalCount = 0;

    switch (table) {
      case 'users':
        data = await prisma.user.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                sessions: true,
                queueRequests: true,
                loraPresets: true,
              },
            },
          },
        });
        totalCount = await prisma.user.count();
        break;

      case 'sessions':
        data = await prisma.session.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                nickname: true,
                discordUsername: true,
              },
            },
          },
        });
        totalCount = await prisma.session.count();
        break;

      case 'queue_requests':
        data = await prisma.queueRequest.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                nickname: true,
                discordUsername: true,
              },
            },
          },
        });
        totalCount = await prisma.queueRequest.count();
        break;

      case 'lora_presets':
        data = await prisma.loRAPreset.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                nickname: true,
                discordUsername: true,
              },
            },
            _count: {
              select: {
                loraItems: true,
              },
            },
          },
        });
        totalCount = await prisma.loRAPreset.count();
        break;

      case 'lora_preset_items':
        data = await prisma.loRAPresetItem.findMany({
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            preset: {
              select: {
                name: true,
                user: {
                  select: {
                    nickname: true,
                  },
                },
              },
            },
          },
        });
        totalCount = await prisma.loRAPresetItem.count();
        break;

      default:
        return NextResponse.json({ error: '지원하지 않는 테이블입니다.' }, { status: 400 });
    }

    return NextResponse.json({
      data,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      limit,
    });

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: '데이터베이스 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}