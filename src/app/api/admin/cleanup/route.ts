import { createRouteHandler } from '@/lib/api/route-handler';
import { cleanupTempFiles } from '@/lib/utils/file-cleanup';
import { createLogger } from '@/lib/logger';
import { parseBody } from '@/lib/validations/parse';
import { cleanupSchema } from '@/lib/validations/schemas/admin';

const log = createLogger('admin');

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const body = await req.json();
    const parsed = parseBody(cleanupSchema, body);
    if (!parsed.success) return parsed.response;

    const { maxAgeHours } = parsed.data;
    log.info('Manual temp file cleanup request', { maxAgeHours });

    const result = await cleanupTempFiles(maxAgeHours);

    return {
      result,
      message: `${result.deletedFiles}개 파일 정리 완료 (${result.totalSize}바이트)`
    };
  }
);

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    log.info('Auto temp file cleanup started');

    const result = await cleanupTempFiles(1);

    return {
      result,
      message: `자동 정리 완료: ${result.deletedFiles}개 파일 삭제`
    };
  }
);
