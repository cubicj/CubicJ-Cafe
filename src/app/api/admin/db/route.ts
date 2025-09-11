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
    const limit = parseInt(searchParams.get('limit') || '25');
    const orderBy = searchParams.get('orderBy');
    const orderDirection = searchParams.get('orderDirection') || 'desc';
    const offset = (page - 1) * limit;

    if (!table) {
      const tables = [
        { name: 'users', displayName: '사용자', count: await prisma.user.count() },
        { name: 'queue_requests', displayName: '큐 요청', count: await prisma.queueRequest.count() },
        { name: 'lora_presets', displayName: 'LoRA 프리셋', count: await prisma.loRAPreset.count() },
      ];
      return NextResponse.json({ tables });
    }

    let data: unknown[] = [];
    let totalCount = 0;

    // 테이블별 기본 정렬 및 허용 정렬 필드 정의
    const getOrderBy = (table: string, orderBy: string | null, orderDirection: string) => {
      const direction = orderDirection === 'asc' ? 'asc' as const : 'desc' as const;
      
      switch (table) {
        case 'users':
          const userFields = ['nickname', 'discordUsername', 'createdAt', 'lastLoginAt'];
          if (orderBy && userFields.includes(orderBy)) {
            return { [orderBy]: direction };
          }
          return { createdAt: 'desc' as const }; // 기본 정렬: 최신 가입순
        
        case 'queue_requests':
          const queueFields = ['nickname', 'status', 'position', 'createdAt', 'startedAt', 'completedAt'];
          if (orderBy && queueFields.includes(orderBy)) {
            return { [orderBy]: direction };
          }
          return { createdAt: 'desc' as const }; // 기본 정렬: 최신 요청순
        
        case 'lora_presets':
          const presetFields = ['name', 'createdAt', 'isDefault', 'isPublic'];
          if (orderBy && presetFields.includes(orderBy)) {
            return { [orderBy]: direction };
          }
          return { createdAt: 'desc' as const }; // 기본 정렬: 최신 생성순
        
        default:
          return { createdAt: 'desc' as const };
      }
    };

    switch (table) {
      case 'users':
        data = await prisma.user.findMany({
          skip: offset,
          take: limit,
          orderBy: getOrderBy(table, orderBy, orderDirection),
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


      case 'queue_requests':
        data = await prisma.queueRequest.findMany({
          skip: offset,
          take: limit,
          orderBy: getOrderBy(table, orderBy, orderDirection),
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
          orderBy: getOrderBy(table, orderBy, orderDirection),
          include: {
            user: {
              select: {
                nickname: true,
                discordUsername: true,
              },
            },
            loraItems: {
              orderBy: { order: 'asc' },
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