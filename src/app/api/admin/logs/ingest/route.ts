import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { logBuffer } from '@/lib/log-buffer';
import { parseBody } from '@/lib/validations/parse';
import { logIngestSchema } from '@/lib/validations/schemas/admin';

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
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = parseBody(logIngestSchema, body);
    if (!parsed.success) return parsed.response;

    let accepted = 0;

    for (const raw of parsed.data.entries) {
      const entry = raw as Partial<IngestEntry>;
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
