import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { sessionManager } from '@/lib/auth/session';
import { logBuffer } from '@/lib/log-buffer';

const MAX_ENTRIES_PER_REQUEST = 100;

interface IngestEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  meta?: Record<string, unknown>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionId = sessionManager.getSessionIdFromRequest(request);
  const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
  if (!session?.user || !isAdmin(session.user.discordId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { entries?: IngestEntry[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const entries = body.entries;
  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: 'entries must be an array' }, { status: 400 });
  }

  const limited = entries.slice(0, MAX_ENTRIES_PER_REQUEST);
  let accepted = 0;

  for (const entry of limited) {
    if (!entry.timestamp || !entry.level || !entry.category || !entry.message) continue;
    logBuffer.push({
      timestamp: entry.timestamp,
      level: entry.level,
      category: entry.category,
      message: entry.message,
      meta: entry.meta,
      source: 'client',
    });
    accepted++;
  }

  return NextResponse.json({ accepted });
}
