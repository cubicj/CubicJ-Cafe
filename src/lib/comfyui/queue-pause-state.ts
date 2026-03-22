import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('queue');

declare global {
  var __queuePauseAfterPosition: number | null | undefined;
}

export function getQueuePauseAfterPosition(): number | null {
  return globalThis.__queuePauseAfterPosition ?? null;
}

export async function setQueuePauseAfterPosition(position: number | null): Promise<void> {
  globalThis.__queuePauseAfterPosition = position;
  if (position !== null) {
    await prisma.systemSetting.upsert({
      where: { key: 'queue_pause_after_position' },
      update: { value: String(position) },
      create: { key: 'queue_pause_after_position', value: String(position), type: 'number', category: 'system' }
    });
    log.info('Queue pause set', { position });
  } else {
    await prisma.systemSetting.deleteMany({ where: { key: 'queue_pause_after_position' } });
    log.info('Queue pause cleared');
  }
}

export async function initQueuePauseState(): Promise<void> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'queue_pause_after_position' }
    });
    const parsed = setting ? parseInt(setting.value) : null;
    globalThis.__queuePauseAfterPosition = parsed !== null && !isNaN(parsed) ? parsed : null;
    if (globalThis.__queuePauseAfterPosition !== null) {
      log.info('Queue pause state loaded', { position: globalThis.__queuePauseAfterPosition });
    }
  } catch (error) {
    log.error('Queue pause state init failed', { error: error instanceof Error ? error.message : String(error) });
    globalThis.__queuePauseAfterPosition = null;
  }
}
