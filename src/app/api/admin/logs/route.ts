import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';
import fs from 'fs/promises';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  category?: string;
  message: string;
  meta?: object;
}

interface LogsResponse {
  entries: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export async function GET(request: NextRequest): Promise<Response> {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    const { searchParams } = req.nextUrl;
    const today = new Date().toISOString().split('T')[0];
    const date = searchParams.get('date') || today;
    const level = searchParams.get('level')?.toLowerCase() || null;
    const category = searchParams.get('category')?.toLowerCase() || null;
    const search = searchParams.get('search')?.toLowerCase() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(1000, parseInt(searchParams.get('limit') || '100', 10)));

    const logDir = process.env.LOG_DIR || './logs';
    const logPath = path.join(logDir, `application-${date}.log`);

    let raw: string;
    try {
      raw = await fs.readFile(logPath, 'utf8');
    } catch {
      return NextResponse.json({ entries: [], total: 0, page, totalPages: 0 } satisfies LogsResponse);
    }

    const lines = raw.split('\n').filter(line => line.trim());
    const entries: LogEntry[] = [];

    for (const line of lines) {
      let entry: LogEntry;
      try {
        entry = JSON.parse(line) as LogEntry;
      } catch {
        continue;
      }

      if (level && entry.level?.toLowerCase() !== level) continue;
      if (category && entry.category?.toLowerCase() !== category) continue;
      if (search && !entry.message?.toLowerCase().includes(search)) continue;

      entries.push(entry);
    }

    entries.reverse();

    const total = entries.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paged = entries.slice(offset, offset + limit);

    return NextResponse.json({ entries: paged, total, page, totalPages } satisfies LogsResponse);
  });
}
