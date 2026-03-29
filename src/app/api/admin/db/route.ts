import { prisma } from '@/lib/database/prisma';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseQuery } from '@/lib/validations/parse';
import { dbQuerySchema } from '@/lib/validations/schemas/admin';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const parsed = parseQuery(dbQuerySchema, req.nextUrl.searchParams);
    if (!parsed.success) return parsed.response;

    const { table, page, limit, orderBy, orderDirection } = parsed.data;
    const offset = (page - 1) * limit;

    if (!table) {
      const tables = [
        { name: 'users', displayName: '사용자', count: await prisma.user.count() },
        { name: 'queue_requests', displayName: '큐 요청', count: await prisma.queueRequest.count() },
        { name: 'lora_presets', displayName: 'LoRA 프리셋', count: await prisma.loRAPreset.count() },
      ];
      return { tables };
    }

    let data: unknown[] = [];
    let totalCount = 0;

    const getOrderBy = (table: string, orderBy: string | undefined, orderDirection: string) => {
      const direction = orderDirection === 'asc' ? 'asc' as const : 'desc' as const;

      switch (table) {
        case 'users': {
          const userFields = ['nickname', 'discordUsername', 'createdAt', 'lastLoginAt'];
          if (orderBy && userFields.includes(orderBy)) {
            return { [orderBy]: direction };
          }
          return { createdAt: 'desc' as const };
        }
        case 'queue_requests': {
          const queueFields = ['nickname', 'status', 'position', 'createdAt', 'startedAt', 'completedAt'];
          if (orderBy && queueFields.includes(orderBy)) {
            return { [orderBy]: direction };
          }
          return { createdAt: 'desc' as const };
        }
        case 'lora_presets': {
          const presetFields = ['name', 'createdAt', 'isDefault', 'isPublic'];
          if (orderBy && presetFields.includes(orderBy)) {
            return { [orderBy]: direction };
          }
          return { createdAt: 'desc' as const };
        }
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
          select: {
            id: true,
            nickname: true,
            status: true,
            position: true,
            prompt: true,
            imageFile: true,
            endImageFile: true,
            audioFile: true,
            loraPresetData: true,
            isNSFW: true,
            jobId: true,
            videoModel: true,
            generationMode: true,
            workflowJson: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
            error: true,
            user: {
              select: {
                nickname: true,
                discordUsername: true,
              },
            },
          },
        });
        data = (data as Record<string, unknown>[]).map(({ workflowJson, ...rest }) => ({
          ...rest,
          hasWorkflow: !!workflowJson,
        }));
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
    }

    return {
      data,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      limit,
    };
  }
);
