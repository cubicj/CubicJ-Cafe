import { prisma } from './prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('database');

export async function getSystemSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.value || defaultValue;
  } catch (error) {
    log.error('System setting fetch error', { key, error: error instanceof Error ? error.message : String(error) });
    return defaultValue;
  }
}

export async function getSystemSettingAsNumber(key: string, defaultValue: number = 0): Promise<number> {
  try {
    const value = await getSystemSetting(key, defaultValue.toString());
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch {
    return defaultValue;
  }
}

export async function setSystemSetting(
  key: string, 
  value: string, 
  type: string = 'string', 
  category: string = 'general'
): Promise<void> {
  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value, type, category },
      create: { key, value, type, category }
    });
  } catch (error) {
    log.error('System setting save error', { key, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function getNegativePrompt(): Promise<string> {
  const defaultNegativePrompt = '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走, wet skin, oily skin, wet hair, oily hair, shiny hair, plastic hair, realistic face, realistic skin';
  return await getSystemSetting('negative_prompt', defaultNegativePrompt);
}

export async function setNegativePrompt(prompt: string): Promise<void> {
  await setSystemSetting('negative_prompt', prompt, 'string', 'video_generation');
}

export async function getQualityPrompt(): Promise<string> {
  const defaultQualityPrompt = "The animation's character design, line work, and color palette must remain perfectly consistent with the anime aesthetic of the provided source image in every frame.";
  return await getSystemSetting('quality_prompt', defaultQualityPrompt);
}

export async function setQualityPrompt(prompt: string): Promise<void> {
  await setSystemSetting('quality_prompt', prompt, 'string', 'video_generation');
}

export async function getVideoResolution(): Promise<number> {
  return await getSystemSettingAsNumber('video_resolution', 560);
}

export async function initializeDefaultSettings(): Promise<void> {
  const defaultSettings = [
    { key: 'video_resolution', value: '560', type: 'number', category: 'video' },
    { key: 'cfg_scale', value: '3', type: 'number', category: 'generation' },
    { 
      key: 'negative_prompt', 
      value: '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低질量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走, wet skin, oily skin, wet hair, oily hair, shiny hair, plastic hair, realistic face, realistic skin', 
      type: 'string', 
      category: 'video_generation' 
    },
    { 
      key: 'quality_prompt', 
      value: "The animation's character design, line work, and color palette must remain perfectly consistent with the anime aesthetic of the provided source image in every frame.", 
      type: 'string', 
      category: 'video_generation' 
    },
  ];

  for (const setting of defaultSettings) {
    try {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      });
    } catch (error) {
      log.error('Default setting init error', { key: setting.key, error: error instanceof Error ? error.message : String(error) });
    }
  }
}