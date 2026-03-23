import { createRouteHandler } from '@/lib/api/route-handler';
import { prisma } from '@/lib/database/prisma';

export const GET = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    const userId = parseInt(req.user!.id);

    const [queueRequestCount, loraPresetCount] = await Promise.all([
      prisma.queueRequest.count({
        where: { userId }
      }),
      prisma.loRAPreset.count({
        where: { userId }
      })
    ]);

    return {
      totalQueueRequests: queueRequestCount,
      loraPresetCount
    };
  }
);
