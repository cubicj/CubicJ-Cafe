import { prisma } from '@/lib/database/prisma'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'
import type { VideoModel } from '@/lib/comfyui/workflows/types'
import { createLogger } from '@/lib/logger'

const log = createLogger('database')

const ACTIVE_MODEL_KEY = 'system.active_model'

export async function getActiveModel(): Promise<VideoModel> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: ACTIVE_MODEL_KEY }
  })
  const model = setting?.value as VideoModel
  return model && model in MODEL_REGISTRY ? model : 'ltx'
}

export async function setActiveModel(model: VideoModel): Promise<void> {
  if (!(model in MODEL_REGISTRY)) {
    throw new Error(`지원하지 않는 모델: ${model}`)
  }
  await prisma.systemSetting.upsert({
    where: { key: ACTIVE_MODEL_KEY },
    update: { value: model },
    create: { key: ACTIVE_MODEL_KEY, value: model, type: 'string', category: 'system' }
  })
}

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
  highDiffusionModel: 'REDACTED_MODEL.safetensors',
  lowDiffusionModel: 'REDACTED_MODEL.safetensors',
  textEncoder: 'REDACTED_MODEL.safetensors',
  vae: 'REDACTED_MODEL.safetensors',
  upscaleModel: 'REDACTED_MODEL.safetensors',
  clipVision: 'REDACTED_MODEL.safetensors',
  ksampler: 'euler_ancestral',
  highCfg: 3.0,
  lowCfg: 3.0,
  highShift: 5.0,
  lowShift: 5.0
}

type SettingType = 'string' | 'number'

interface SettingSchema {
  key: string
  type: SettingType
}

const SETTING_SCHEMA: Record<keyof ModelSettings, SettingSchema> = {
  highDiffusionModel: { key: 'model.high_diffusion', type: 'string' },
  lowDiffusionModel:  { key: 'model.low_diffusion', type: 'string' },
  textEncoder:        { key: 'model.text_encoder', type: 'string' },
  vae:                { key: 'model.vae', type: 'string' },
  upscaleModel:       { key: 'model.upscale', type: 'string' },
  clipVision:         { key: 'model.clip_vision', type: 'string' },
  ksampler:           { key: 'model.ksampler', type: 'string' },
  highCfg:            { key: 'model.high_cfg', type: 'number' },
  lowCfg:             { key: 'model.low_cfg', type: 'number' },
  highShift:          { key: 'model.high_shift', type: 'number' },
  lowShift:           { key: 'model.low_shift', type: 'number' },
}

const ALL_SETTING_KEYS = Object.values(SETTING_SCHEMA).map(s => s.key)

export async function getModelSettings(): Promise<ModelSettings> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ALL_SETTING_KEYS } }
    })

    const settingMap = new Map(settings.map((s: { key: string; value: string }) => [s.key, s.value]))

    const result = { ...DEFAULT_MODEL_SETTINGS }
    for (const [prop, schema] of Object.entries(SETTING_SCHEMA)) {
      const dbValue = settingMap.get(schema.key)
      if (dbValue !== undefined) {
        (result as any)[prop] = schema.type === 'number' ? parseFloat(dbValue) : dbValue
      }
    }

    return result
  } catch (error) {
    log.error('Model settings fetch failed', { error: error instanceof Error ? error.message : String(error) })
    return DEFAULT_MODEL_SETTINGS
  }
}

export async function updateModelSettings(settings: Partial<ModelSettings>): Promise<void> {
  try {
    const updates: Array<{ key: string; value: string; type: string; category: string }> = []

    for (const [prop, schema] of Object.entries(SETTING_SCHEMA)) {
      const value = (settings as any)[prop]
      if (value === undefined) continue
      updates.push({
        key: schema.key,
        value: schema.type === 'number' ? String(value) : value,
        type: schema.type,
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

    log.info('Model settings updated', { settings })
  } catch (error) {
    log.error('Model settings update failed', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

export async function initializeModelSettings(): Promise<void> {
  try {
    const existingSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ALL_SETTING_KEYS } }
    })

    const existingKeys = new Set(existingSettings.map((s: { key: string }) => s.key))

    const newSettings: Array<{ key: string; value: string; type: string; category: string }> = []

    for (const [prop, schema] of Object.entries(SETTING_SCHEMA)) {
      if (existingKeys.has(schema.key)) continue
      const defaultValue = (DEFAULT_MODEL_SETTINGS as any)[prop]
      newSettings.push({
        key: schema.key,
        value: typeof defaultValue === 'number' ? defaultValue.toString() : defaultValue,
        type: schema.type,
        category: 'models'
      })
    }

    const activeModelSetting = await prisma.systemSetting.findUnique({
      where: { key: ACTIVE_MODEL_KEY }
    })
    if (!activeModelSetting) {
      newSettings.push({
        key: ACTIVE_MODEL_KEY,
        value: 'ltx',
        type: 'string',
        category: 'system'
      })
    }

    if (newSettings.length > 0) {
      await prisma.systemSetting.createMany({
        data: newSettings
      })
      log.info('Model settings initialized', { count: newSettings.length })
    }
  } catch (error) {
    log.error('Model settings initialization failed', { error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}
