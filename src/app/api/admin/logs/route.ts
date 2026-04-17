import { createRouteHandler } from '@/lib/api/route-handler';
import { createLogger } from '@/lib/logger';
import { parseQuery } from '@/lib/validations/parse';
import { logsQuerySchema } from '@/lib/validations/schemas/admin';
import fs from 'fs/promises';
import path from 'path';

const log = createLogger('admin');

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

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const parsed = parseQuery(logsQuerySchema, req.nextUrl.searchParams);
    if (!parsed.success) return parsed.response;

    const { page, limit, level, category, search } = parsed.data;
    const today = new Date().toISOString().split('T')[0];
    const date = parsed.data.date || today;

    const logDir = process.env.LOG_DIR || './logs';
    const logPath = path.join(logDir, `application-${date}.log`);

    let raw: string;
    try {
      raw = await fs.readFile(logPath, 'utf8');
    } catch (e) {
      log.error('log file read failed', { error: e instanceof Error ? e.message : String(e) });
      throw e;
    }

    const lines = raw.split('\n').filter(line => line.trim());
    const entries: LogEntry[] = [];

    for (const line of lines) {
      let entry: LogEntry;
      try {
        entry = JSON.parse(line) as LogEntry;
      } catch (e) {
        log.error('log file read failed', { error: e instanceof Error ? e.message : String(e) });
        throw e;
      }

      if (level && entry.level?.toLowerCase() !== level) continue;
      if (category && entry.category?.toLowerCase() !== category) continue;
      if (search && !entry.message?.toLowerCase().includes(search.toLowerCase())) continue;

      entries.push(entry);
    }

    entries.reverse();

    const total = entries.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paged = entries.slice(offset, offset + limit);

    return { entries: paged, total, page, totalPages } satisfies LogsResponse;
  }
);
