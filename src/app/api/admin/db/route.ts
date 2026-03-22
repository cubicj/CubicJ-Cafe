import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';

import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
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

      const getOrderBy = (table: string, orderBy: string | null, orderDirection: string) => {
        const direction = orderDirection === 'asc' ? 'asc' as const : 'desc' as const;

        switch (table) {
          case 'users':
            const userFields = ['nickname', 'discordUsername', 'createdAt', 'lastLoginAt'];
            if (orderBy && userFields.includes(orderBy)) {
              return { [orderBy]: direction };
            }
            return { createdAt: 'desc' as const };

          case 'queue_requests':
            const queueFields = ['nickname', 'status', 'position', 'createdAt', 'startedAt', 'completedAt'];
            if (orderBy && queueFields.includes(orderBy)) {
              return { [orderBy]: direction };
            }
            return { createdAt: 'desc' as const };

          case 'lora_presets':
            const presetFields = ['name', 'createdAt', 'isDefault', 'isPublic'];
            if (orderBy && presetFields.includes(orderBy)) {
              return { [orderBy]: direction };
            }
            return { createdAt: 'desc' as const };

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
      log.error('Database query error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ error: '데이터베이스 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }
  });
}
