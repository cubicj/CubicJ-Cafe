import type { ComfyUIClient } from '../client'
import { getLtxrSettings, type LtxrSettings } from '@/lib/database/system-settings'
import { getWatermarkAssetBlob } from '@/lib/database/watermark-assets'
import type {
  GenerationParams,
  H3Ref2vaReferences,
  H3Ref2vaResolution,
  LtxrGenerationParams,
  VideoModel,
} from './types'

interface ParamRequest {
  prompt: string
  videoDuration: number
  isNSFW: boolean
}

interface PrepareParamsInput {
  request: ParamRequest
  inputImage?: string
  endImage?: string
  referenceAudio?: string
  references?: H3Ref2vaReferences
  resolution?: H3Ref2vaResolution
  client: ComfyUIClient
}

type PreparedGenerationParams = GenerationParams | (
  LtxrGenerationParams & { settings: LtxrSettings }
)

type ParamPreparer = (
  input: PrepareParamsInput
) => Promise<PreparedGenerationParams>

async function uploadLtxrWatermark(
  assetId: string | null,
  client: ComfyUIClient
): Promise<string> {
  if (!assetId) {
    throw new Error('LTXR watermark is enabled but no watermark asset is configured.')
  }

  const asset = await getWatermarkAssetBlob(assetId)
  const blob = new Blob([Buffer.from(asset.imageBlob)], { type: asset.mimeType })
  const file = new File([blob], asset.filename, { type: asset.mimeType })
  return client.uploadImage(file)
}

function requireInputImage(inputImage: string | undefined): string {
  if (!inputImage) {
    throw new Error('Start image is required for this model')
  }
  return inputImage
}

const PARAM_PREPARERS: Record<VideoModel, ParamPreparer> = {
  wan: async ({ request, inputImage, endImage }) => ({
    model: 'wan',
    prompt: request.prompt,
    inputImage: requireInputImage(inputImage),
    videoDuration: request.videoDuration,
    isNSFW: request.isNSFW,
    endImage,
  }),
  ltxa: async ({ request, inputImage, referenceAudio }) => ({
    model: 'ltxa',
    prompt: request.prompt,
    inputImage: requireInputImage(inputImage),
    videoDuration: request.videoDuration,
    isNSFW: request.isNSFW,
    referenceAudio,
  }),
  ltxr: async ({ request, inputImage, endImage, referenceAudio, client }) => {
    const settings = await getLtxrSettings()
    const watermarkImage = settings.watermarkEnabled
      ? await uploadLtxrWatermark(settings.watermarkImageAssetId, client)
      : undefined

    return {
      model: 'ltxr',
      prompt: request.prompt,
      inputImage: requireInputImage(inputImage),
      videoDuration: request.videoDuration,
      isNSFW: request.isNSFW,
      endImage,
      referenceAudio,
      watermarkImage,
      settings,
    }
  },
  'ltx-wan': async ({ request, inputImage, endImage, referenceAudio }) => ({
    model: 'ltx-wan',
    prompt: request.prompt,
    inputImage: requireInputImage(inputImage),
    videoDuration: request.videoDuration,
    isNSFW: request.isNSFW,
    endImage,
    referenceAudio,
  }),
  'h3-fl2va': async ({ request, inputImage, endImage }) => {
    if (!inputImage && !endImage) {
      throw new Error('H3 FL2VA requires at least one image')
    }
    return {
      model: 'h3-fl2va',
      prompt: request.prompt,
      videoDuration: request.videoDuration,
      isNSFW: request.isNSFW,
      inputImage,
      endImage,
    }
  },
  'h3-ref2va': async ({ request, references, resolution }) => {
    if (!references || references.images.length + references.videos.length + references.audios.length === 0) {
      throw new Error('H3 Ref2VA requires at least one reference')
    }
    if (!resolution) {
      throw new Error('H3 Ref2VA requires resolution parameters')
    }
    if (resolution.mode === 'firstImage' && references.images.length === 0) {
      throw new Error('H3 Ref2VA firstImage resolution requires at least one reference image')
    }
    return {
      model: 'h3-ref2va',
      prompt: request.prompt,
      videoDuration: request.videoDuration,
      isNSFW: request.isNSFW,
      refImages: references.images,
      refVideos: references.videos,
      refAudios: references.audios,
      resolution,
    }
  },
}

export async function prepareGenerationParams(
  model: string,
  input: PrepareParamsInput
): Promise<GenerationParams> {
  const preparer = PARAM_PREPARERS[model as VideoModel]
  if (!preparer) {
    throw new Error(`Unsupported video model: ${model}`)
  }

  return preparer(input)
}
