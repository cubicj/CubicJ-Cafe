import { NextRequest } from 'next/server';
import { logBuffer } from '@/lib/log-buffer';
import { createRouteHandler } from '@/lib/api/route-handler';

export const dynamic = 'force-dynamic';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'logs' },
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') ?? undefined;
    const category = searchParams.get('category') ?? undefined;

    const subscriberId = crypto.randomUUID();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const initial = logBuffer.getRecent(100).filter((entry) => {
          if (level && level !== entry.level) return false;
          if (category && !category.split(',').includes(entry.category)) return false;
          return true;
        });

        for (const entry of initial) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(entry)}\n\n`));
        }

        logBuffer.subscribe({
          id: subscriberId,
          controller,
          filters: { level, category },
        });
      },
      cancel() {
        logBuffer.unsubscribe(subscriberId);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
);
