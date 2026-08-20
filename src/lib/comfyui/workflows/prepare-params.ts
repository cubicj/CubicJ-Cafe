import type { ComfyUIClient } from '../client'
import { getLtxrSettings, type LtxrSettings } from '@/lib/database/system-settings'
import { getWatermarkAssetBlob } from '@/lib/database/watermark-assets'
import type {
  GenerationParams,
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
  inputImage: string
  endImage?: string
  referenceAudio?: string
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

const PARAM_PREPARERS: Record<VideoModel, ParamPreparer> = {
  wan: async ({ request, inputImage, endImage }) => ({
    model: 'wan',
    prompt: request.prompt,
    inputImage,
    videoDuration: request.videoDuration,
    isNSFW: request.isNSFW,
    endImage,
  }),
  ltxa: async ({ request, inputImage, referenceAudio }) => ({
    model: 'ltxa',
    prompt: request.prompt,
    inputImage,
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
      inputImage,
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
    inputImage,
    videoDuration: request.videoDuration,
    isNSFW: request.isNSFW,
    endImage,
    referenceAudio,
  }),
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
