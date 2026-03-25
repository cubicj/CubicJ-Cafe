import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { applyLtxLoraChain } from './lora-manager'
import { createLogger } from '@/lib/logger'
import { getLtxSettings } from '@/lib/database/system-settings'

const log = createLogger('comfyui')

export async function buildLtxWorkflow(
  params: LtxGenerationParams,
  server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxSettings()
  const workflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  if (workflow['5']) {
    workflow['5'].inputs.text = params.prompt
  }

  if (workflow['6']?.inputs) {
    workflow['6'].inputs.text = settings.negativePrompt
  }

  if (workflow['18']?.inputs) {
    workflow['18'].inputs.cfg = settings.cfg
  }

  if (workflow['20']?.inputs) {
    workflow['20'].inputs.sampler_name = settings.sampler1stPass
  }
  if (workflow['98']?.inputs) {
    workflow['98'].inputs.sampler_name = settings.sampler2ndPass
  }

  if (workflow['304']?.inputs) {
    workflow['304'].inputs.sigmas = settings.sigmas1stPass
  }
  if (workflow['303']?.inputs) {
    workflow['303'].inputs.sigmas = settings.sigmas2ndPass
  }

  if (workflow['72']?.inputs) {
    workflow['72'].inputs.nag_scale = settings.nagScale
  }

  if (workflow['103']?.inputs) {
    workflow['103'].inputs.value = settings.duration
  }

  if (workflow['86']?.inputs) {
    workflow['86'].inputs.megapixels = settings.megapixels
  }
  if (workflow['264']?.inputs) {
    workflow['264'].inputs.megapixels = settings.megapixels
  }

  if (workflow['266']?.inputs) {
    workflow['266'].inputs.img_compression = settings.imgCompression
  }
  if (workflow['267']?.inputs) {
    workflow['267'].inputs.img_compression = settings.imgCompression
  }

  if (workflow['87']) {
    workflow['87'].inputs.image = params.inputImage
  }

  if (params.endImage) {
    if (workflow['260']) {
      workflow['260'].inputs.image = params.endImage
    }
  } else {
    handleEndImageBypass(workflow)
  }

  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLtxLoraChain(workflow, params.loraPreset, server)
  } else {
    removeLoraPlaceholder(workflow)
  }

  if (workflow['16']) {
    workflow['16'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }
  if (workflow['32']) {
    workflow['32'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }

  if (workflow['300'] && params.inputImage) {
    const baseImageName = params.inputImage.replace(/\.(png|jpg|jpeg|webp)$/i, '')
    workflow['300'].inputs.filename_prefix = `LTX/${baseImageName}`
  }

  log.info('LTX workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    duration: settings.duration,
    loraEnabled: settings.loraEnabled,
    hasLoraPreset: !!(params.loraPreset && params.loraPreset.loraItems?.length),
  })

  return workflow
}

function removeLoraPlaceholder(workflow: ComfyUIWorkflow) {
  if (workflow['268']?.inputs) {
    workflow['268'].inputs.model = ['298', 0]
  }
  delete workflow['296']
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  if (workflow['265']?.inputs) {
    workflow['265'].inputs['num_images'] = '1'
    delete workflow['265'].inputs['num_images.image_2']
    delete workflow['265'].inputs['num_images.index_2']
    delete workflow['265'].inputs['num_images.strength_2']
  }

  delete workflow['260']
  delete workflow['261']
  delete workflow['264']
  delete workflow['267']
}
