import { prisma } from '@/lib/database/prisma'

export type ModelSettings = {
  highDiffusionModel: string
  lowDiffusionModel: string
  textEncoder: string
  vae: string
  upscaleModel: string
  clipVision: string
  ksampler: string
  highCfg: number
  lowCfg: number
  highShift: number
  lowShift: number
}

const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  highDiffusionModel: 'Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors',
  lowDiffusionModel: 'Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors',
  textEncoder: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
  vae: 'wan_2.1_vae.safetensors',
  upscaleModel: '2x-AnimeSharpV4_Fast_RCAN_PU.safetensors',
  clipVision: 'wan21NSFWClipVisionH_v10.safetensors',
  ksampler: 'euler_ancestral',
  highCfg: 3.0,
  lowCfg: 3.0,
  highShift: 5.0,
  lowShift: 5.0
}

const MODEL_SETTING_KEYS = {
  HIGH_DIFFUSION: 'model.high_diffusion',
  LOW_DIFFUSION: 'model.low_diffusion', 
  TEXT_ENCODER: 'model.text_encoder',
  VAE: 'model.vae',
  UPSCALE: 'model.upscale',
  CLIP_VISION: 'model.clip_vision',
  KSAMPLER: 'model.ksampler',
  HIGH_CFG: 'model.high_cfg',
  LOW_CFG: 'model.low_cfg',
  HIGH_SHIFT: 'model.high_shift',
  LOW_SHIFT: 'model.low_shift'
} as const

export async function getModelSettings(): Promise<ModelSettings> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: Object.values(MODEL_SETTING_KEYS)
        }
      }
    })

    const settingMap = new Map(settings.map((s: { key: string; value: string }) => [s.key, s.value]))

    return {
      highDiffusionModel: settingMap.get(MODEL_SETTING_KEYS.HIGH_DIFFUSION) || DEFAULT_MODEL_SETTINGS.highDiffusionModel,
      lowDiffusionModel: settingMap.get(MODEL_SETTING_KEYS.LOW_DIFFUSION) || DEFAULT_MODEL_SETTINGS.lowDiffusionModel,
      textEncoder: settingMap.get(MODEL_SETTING_KEYS.TEXT_ENCODER) || DEFAULT_MODEL_SETTINGS.textEncoder,
      vae: settingMap.get(MODEL_SETTING_KEYS.VAE) || DEFAULT_MODEL_SETTINGS.vae,
      upscaleModel: settingMap.get(MODEL_SETTING_KEYS.UPSCALE) || DEFAULT_MODEL_SETTINGS.upscaleModel,
      clipVision: settingMap.get(MODEL_SETTING_KEYS.CLIP_VISION) || DEFAULT_MODEL_SETTINGS.clipVision,
      ksampler: settingMap.get(MODEL_SETTING_KEYS.KSAMPLER) || DEFAULT_MODEL_SETTINGS.ksampler,
      highCfg: parseFloat(settingMap.get(MODEL_SETTING_KEYS.HIGH_CFG) || DEFAULT_MODEL_SETTINGS.highCfg.toString()),
      lowCfg: parseFloat(settingMap.get(MODEL_SETTING_KEYS.LOW_CFG) || DEFAULT_MODEL_SETTINGS.lowCfg.toString()),
      highShift: parseFloat(settingMap.get(MODEL_SETTING_KEYS.HIGH_SHIFT) || DEFAULT_MODEL_SETTINGS.highShift.toString()),
      lowShift: parseFloat(settingMap.get(MODEL_SETTING_KEYS.LOW_SHIFT) || DEFAULT_MODEL_SETTINGS.lowShift.toString())
    }
  } catch (error) {
    console.error('모델 설정 조회 실패:', error)
    return DEFAULT_MODEL_SETTINGS
  }
}

export async function updateModelSettings(settings: Partial<ModelSettings>): Promise<void> {
  try {
    const updates = []

    if (settings.highDiffusionModel !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.HIGH_DIFFUSION,
        value: settings.highDiffusionModel,
        type: 'string',
        category: 'models'
      })
    }

    if (settings.lowDiffusionModel !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.LOW_DIFFUSION,
        value: settings.lowDiffusionModel,
        type: 'string',
        category: 'models'
      })
    }

    if (settings.textEncoder !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.TEXT_ENCODER,
        value: settings.textEncoder,
        type: 'string',
        category: 'models'
      })
    }

    if (settings.vae !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.VAE,
        value: settings.vae,
        type: 'string',
        category: 'models'
      })
    }

    if (settings.upscaleModel !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.UPSCALE,
        value: settings.upscaleModel,
        type: 'string',
        category: 'models'
      })
    }

    if (settings.clipVision !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.CLIP_VISION,
        value: settings.clipVision,
        type: 'string',
        category: 'models'
      })
    }

    if (settings.ksampler !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.KSAMPLER,
        value: settings.ksampler,
        type: 'string',
        category: 'models'
      })
    }

    if (settings.highCfg !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.HIGH_CFG,
        value: settings.highCfg.toString(),
        type: 'number',
        category: 'models'
      })
    }

    if (settings.lowCfg !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.LOW_CFG,
        value: settings.lowCfg.toString(),
        type: 'number',
        category: 'models'
      })
    }

    if (settings.highShift !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.HIGH_SHIFT,
        value: settings.highShift.toString(),
        type: 'number',
        category: 'models'
      })
    }

    if (settings.lowShift !== undefined) {
      updates.push({
        key: MODEL_SETTING_KEYS.LOW_SHIFT,
        value: settings.lowShift.toString(),
        type: 'number',
        category: 'models'
      })
    }

    for (const update of updates) {
      await prisma.systemSetting.upsert({
        where: { key: update.key },
        create: update,
        update: {
          value: update.value,
          updatedAt: new Date()
        }
      })
    }

    console.log('✅ 모델 설정 업데이트 완료:', settings)
  } catch (error) {
    console.error('모델 설정 업데이트 실패:', error)
    throw error
  }
}

export async function initializeModelSettings(): Promise<void> {
  try {
    const existingSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: Object.values(MODEL_SETTING_KEYS)
        }
      }
    })

    const existingKeys = new Set(existingSettings.map((s: { key: string }) => s.key))

    const newSettings = []

    const keyMapping: Record<string, keyof typeof MODEL_SETTING_KEYS> = {
      highDiffusionModel: 'HIGH_DIFFUSION',
      lowDiffusionModel: 'LOW_DIFFUSION',
      textEncoder: 'TEXT_ENCODER',
      vae: 'VAE',
      upscaleModel: 'UPSCALE',
      clipVision: 'CLIP_VISION',
      ksampler: 'KSAMPLER',
      highCfg: 'HIGH_CFG',
      lowCfg: 'LOW_CFG',
      highShift: 'HIGH_SHIFT',
      lowShift: 'LOW_SHIFT'
    }

    for (const [key, defaultValue] of Object.entries(DEFAULT_MODEL_SETTINGS)) {
      const settingKeyName = keyMapping[key]
      const settingKey = MODEL_SETTING_KEYS[settingKeyName]
      
      if (!existingKeys.has(settingKey)) {
        const isNumberField = key === 'highCfg' || key === 'lowCfg' || key === 'highShift' || key === 'lowShift'
        newSettings.push({
          key: settingKey,
          value: typeof defaultValue === 'number' ? defaultValue.toString() : defaultValue,
          type: isNumberField ? 'number' : 'string',
          category: 'models'
        })
      }
    }

    if (newSettings.length > 0) {
      await prisma.systemSetting.createMany({
        data: newSettings
      })
      console.log(`✅ 모델 설정 초기화 완료: ${newSettings.length}개 설정 추가`)
    }
  } catch (error) {
    console.error('모델 설정 초기화 실패:', error)
    throw error
  }
}