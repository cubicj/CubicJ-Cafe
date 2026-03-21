import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('comfyui');

declare global {
  var __comfyuiEnabled: boolean | undefined;
}

export function isComfyUIEnabled(): boolean {
  return globalThis.__comfyuiEnabled ?? false;
}

export async function setComfyUIEnabled(enabled: boolean): Promise<void> {
  globalThis.__comfyuiEnabled = enabled;
  await prisma.systemSetting.upsert({
    where: { key: 'comfyui_enabled' },
    update: { value: String(enabled) },
    create: { key: 'comfyui_enabled', value: String(enabled), type: 'boolean', category: 'system' }
  });
  log.info('ComfyUI state changed', { enabled });
}

export async function initComfyUIState(): Promise<void> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'comfyui_enabled' }
    });

    if (setting) {
      globalThis.__comfyuiEnabled = setting.value === 'true';
    } else {
      globalThis.__comfyuiEnabled = true;
      await prisma.systemSetting.create({
        data: { key: 'comfyui_enabled', value: 'true', type: 'boolean', category: 'system' }
      });
    }

    log.info('ComfyUI state initialized', { enabled: globalThis.__comfyuiEnabled });
  } catch (error) {
    log.error('ComfyUI state init failed', { error: error instanceof Error ? error.message : String(error) });
    globalThis.__comfyuiEnabled = true;
  }
}
