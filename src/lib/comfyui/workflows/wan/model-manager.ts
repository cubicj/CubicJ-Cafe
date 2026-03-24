import type { ComfyUIWorkflow } from '@/types'
import { getModelSettings } from '@/lib/database/model-settings'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

export async function applyModelSettings(workflow: ComfyUIWorkflow) {
  const modelSettings = await getModelSettings()

  if (workflow['517']?.inputs) {
    workflow['517'].inputs.unet_name = modelSettings.highDiffusionModel
  }

  if (workflow['518']?.inputs) {
    workflow['518'].inputs.unet_name = modelSettings.lowDiffusionModel
  }

  if (workflow['519']?.inputs) {
    workflow['519'].inputs.clip_name = modelSettings.textEncoder
  }

  if (workflow['520']?.inputs) {
    workflow['520'].inputs.vae_name = modelSettings.vae
  }

  if (workflow['545']?.inputs) {
    workflow['545'].inputs.sampler_name = modelSettings.ksampler
  }

  if (workflow['539']?.inputs) {
    workflow['539'].inputs.shift = modelSettings.highShift
  }
  if (workflow['541']?.inputs) {
    workflow['541'].inputs.shift = modelSettings.lowShift
  }

  log.info('Model settings applied', {
    highModel: modelSettings.highDiffusionModel,
    lowModel: modelSettings.lowDiffusionModel,
    textEncoder: modelSettings.textEncoder,
    vae: modelSettings.vae,
    sampler: modelSettings.ksampler,
    highShift: modelSettings.highShift,
    lowShift: modelSettings.lowShift,
  })

  return modelSettings
}
