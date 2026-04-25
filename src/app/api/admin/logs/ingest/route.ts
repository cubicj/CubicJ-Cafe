import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { logBuffer } from '@/lib/log-buffer';
import { redactLogEntry } from '@/lib/logger';
import { parseBody } from '@/lib/validations/parse';
import { logIngestSchema } from '@/lib/validations/schemas/admin';

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

    for (const entry of parsed.data.entries) {
      const redacted = redactLogEntry(entry);
      logBuffer.push({
        timestamp: redacted.timestamp,
        level: redacted.level,
        category: redacted.category,
        message: redacted.message,
        meta: redacted.meta,
        source: 'client',
      });
      accepted++;
    }

    return { accepted };
  }
);
