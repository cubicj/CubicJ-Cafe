import { createRouteHandler } from '@/lib/api/route-handler';
import { prisma } from '@/lib/database/prisma';
import { setSystemSetting, setSystemSettings } from '@/lib/database/system-settings';
import { parseBody } from '@/lib/validations/parse';
import { settingsPutSchema } from '@/lib/validations/schemas/admin';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    const settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    const settingsMap = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = {
        value: setting.value,
        type: setting.type
      };
      return acc;
    }, {} as Record<string, Record<string, { value: string; type: string }>>);

    return settingsMap;
  }
);

export const PUT = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const body = await req.json();
    const parsed = parseBody(settingsPutSchema, body);
    if (!parsed.success) return parsed.response;

    if ('settings' in parsed.data) {
      const items = parsed.data.settings;
      const results = await setSystemSettings(items);

      return {
        message: `${results.length}개 설정이 업데이트되었습니다.`,
        settings: results,
      };
    }

    const { key, value, type, category } = parsed.data;
    const setting = await setSystemSetting(key, value, type, category);

    return {
      message: '설정이 업데이트되었습니다.',
      setting
    };
  }
);
