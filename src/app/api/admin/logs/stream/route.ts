import { NextRequest } from 'next/server';
import { logBuffer } from '@/lib/log-buffer';
import { isAdmin } from '@/lib/auth/admin';
import { sessionManager } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sessionId = sessionManager.getSessionIdFromRequest(request);
  const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
  if (!session?.user || !isAdmin(session.user.discordId)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') ?? undefined;
  const category = searchParams.get('category') ?? undefined;

  const subscriberId = crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const initial = logBuffer.getRecent(100).filter((entry) => {
        if (level && level !== entry.level) return false;
        if (category && category !== entry.category) return false;
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
