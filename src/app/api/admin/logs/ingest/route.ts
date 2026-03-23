import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { logBuffer } from '@/lib/log-buffer';

const MAX_ENTRIES_PER_REQUEST = 100;

interface IngestEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  meta?: Record<string, unknown>;
}

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    let body: { entries?: IngestEntry[] };
    try {
      body = await req.json();
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

    return { accepted };
  }
);
