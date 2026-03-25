import { createLogger } from '@/lib/logger'
import type { ModelListResponse } from './client-types'

const log = createLogger('comfyui')

function extractOptions(data: unknown[]): string[] {
  if (Array.isArray(data[0])) return data[0]
  if (typeof data[0] === 'string' && data[1] && typeof data[1] === 'object' && 'options' in data[1]) {
    return (data[1] as { options: string[] }).options
  }
  return data.filter((item): item is string => typeof item === 'string')
}

const LORA_NODE_NAMES = [
  'LoraLoader',
  'LoRALoader',
  'LoraLoaderModelOnly',
  'Load LoRA',
  'LoRA Loader',
  'Power Lora Loader (rgthree)',
  'LoRA Stack',
  'LoraLoaderStack'
]

const SAMPLER_NODE_NAMES = [
  'KSampler',
  'KSamplerAdvanced',
  'SamplerCustom',
  'KSamplerSelect',
  'Sampler'
]

function findNodeOptions(
  objectInfo: Record<string, unknown>,
  nodeNames: string[],
  fieldName: string
): string[] | null {
  for (const nodeName of nodeNames) {
    const node = objectInfo?.[nodeName] as { input?: { required?: Record<string, unknown[]> } }
    const fieldData = node?.input?.required?.[fieldName]
    if (fieldData) {
      return extractOptions(fieldData)
    }
  }
  return null
}

function extractLoRAs(
  objectInfo: Record<string, unknown>,
  model: string,
  normalizeRunpod: boolean
): string[] {
  const loras = findNodeOptions(objectInfo, LORA_NODE_NAMES, 'lora_name')
  if (!loras) {
    log.warn('No dedicated LoRA node found', {
      availableNodes: Object.keys(objectInfo || {}).filter(key =>
        key.toLowerCase().includes('lora') ||
        key.toLowerCase().includes('embed')
      )
    })
    return []
  }

  const filtered = model === 'ltx'
    ? filterLTXLoRAs(loras, normalizeRunpod)
    : filterWANLoRAs(loras, normalizeRunpod)

  if (filtered.length === 0) {
    log.warn(`No LoRAs found in ${model} folder, returning full list`)
    return filterAllLoRAs(loras, normalizeRunpod)
  }

  return filtered.sort()
}

function extractSamplers(objectInfo: Record<string, unknown>): string[] {
  const samplers = findNodeOptions(objectInfo, SAMPLER_NODE_NAMES, 'sampler_name')
  if (!samplers) {
    log.warn('KSampler node not found', {
      availableNodes: Object.keys(objectInfo || {}).filter(key =>
        key.toLowerCase().includes('sampler') ||
        key.toLowerCase().includes('ksampler')
      )
    })
    return []
  }
  return samplers.sort()
}

function extractModels(objectInfo: Record<string, unknown>): ModelListResponse {
  const result: ModelListResponse = {
    diffusionModels: [],
    textEncoders: [],
    vaes: [],
    upscaleModels: [],
    clipVisions: [],
    ggufClips: [],
    clipEmbeddings: [],
    kjVaes: [],
    latentUpscalers: [],
    vfiCheckpoints: [],
  }

  const loaderMap: Array<[keyof ModelListResponse, string, string]> = [
    ['diffusionModels', 'UNETLoader', 'unet_name'],
    ['textEncoders', 'CLIPLoader', 'clip_name'],
    ['vaes', 'VAELoader', 'vae_name'],
    ['upscaleModels', 'UpscaleModelLoader', 'model_name'],
    ['clipVisions', 'CLIPVisionLoader', 'clip_name'],
    ['ggufClips', 'DualCLIPLoaderGGUF', 'clip_name1'],
    ['clipEmbeddings', 'DualCLIPLoaderGGUF', 'clip_name2'],
    ['kjVaes', 'VAELoaderKJ', 'vae_name'],
    ['latentUpscalers', 'LatentUpscaleModelLoader', 'model_name'],
    ['vfiCheckpoints', 'GMFSS Fortuna VFI', 'ckpt_name'],
  ]

  for (const [key, nodeName, fieldName] of loaderMap) {
    const options = findNodeOptions(objectInfo, [nodeName], fieldName)
    if (options) result[key] = options
  }

  return result
}

function isLoRAFile(fileName: string): boolean {
  return fileName.endsWith('.safetensors') ||
    fileName.endsWith('.ckpt') ||
    fileName.endsWith('.pt')
}

function normalizeLoRAPath(file: string, normalizeRunpod: boolean): string {
  return normalizeRunpod ? file.replace(/\\/g, '/') : file
}

function filterWANLoRAs(loras: unknown[], normalizeRunpod = false): string[] {
  return loras
    .filter((file: unknown) => {
      if (typeof file !== 'string') {
        log.warn('LoRA filename is not a string', { type: typeof file, value: file })
        return false
      }
      const normalizedPath = file.replace(/\\/g, '/').toLowerCase()
      const isInWanFolder = normalizedPath.includes('wan/') || normalizedPath.startsWith('wan/')
      if (!isInWanFolder) return false
      if (!isLoRAFile(file.toLowerCase())) return false
      if (file.toLowerCase().includes('checkpoint') && !file.toLowerCase().includes('lora')) return false
      return true
    })
    .map((file: unknown) => normalizeLoRAPath(file as string, normalizeRunpod))
}

function filterLTXLoRAs(loras: unknown[], normalizeRunpod = false): string[] {
  return loras
    .filter((file: unknown) => {
      if (typeof file !== 'string') return false
      const normalizedPath = file.replace(/\\/g, '/').toLowerCase()
      if (!normalizedPath.includes('ltx/custom/')) return false
      return isLoRAFile(file.toLowerCase())
    })
    .map((file: unknown) => normalizeLoRAPath(file as string, normalizeRunpod))
}

function filterAllLoRAs(loras: unknown[], normalizeRunpod = false): string[] {
  return loras
    .filter((file: unknown) => typeof file === 'string' && isLoRAFile((file as string).toLowerCase()))
    .map((file: unknown) => normalizeLoRAPath(file as string, normalizeRunpod))
    .sort()
}

async function fetchRunpodObjectInfo(serverUrl: string): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  const response = await fetch(`${serverUrl}/object_info`, {
    method: 'GET',
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json' }
  })

  clearTimeout(timeoutId)

  if (!response.ok) {
    throw new Error(`런포드 서버 응답 오류: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

export class ComfyUIModelManager {
  private baseURL: string
  private timeout: number
  private isRunpodServer: boolean
  private serverManager: { checkActiveRunpodServers: () => Promise<string[]> }

  constructor(
    baseURL: string,
    timeout: number = 10000,
    isRunpodServer: boolean,
    serverManager: { checkActiveRunpodServers: () => Promise<string[]> }
  ) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.isRunpodServer = isRunpodServer
    this.serverManager = serverManager
  }

  async getObjectInfo(): Promise<Record<string, unknown>> {
    try {
      return await this.makeRequest<Record<string, unknown>>('/object_info')
    } catch (error) {
      log.error('ComfyUI object_info fetch failed', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async getLoRAList(model: string = 'wan'): Promise<string[]> {
    try {
      const objectInfo = await this.getObjectInfoWithRunpodFallback()
      const normalizeRunpod = this.isRunpodServer || await this.isUsingRunpod()
      const loras = extractLoRAs(objectInfo.data, model, normalizeRunpod)
      log.info('LoRA list fetched', { source: objectInfo.source, model, count: loras.length })
      return loras
    } catch (error) {
      log.error('Failed to fetch LoRA list', { error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }

  async getSamplerList(): Promise<string[]> {
    try {
      const objectInfo = await this.getObjectInfoWithRunpodFallback()
      return extractSamplers(objectInfo.data)
    } catch (error) {
      log.error('Failed to fetch sampler list', { error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }

  async getModelList(): Promise<ModelListResponse> {
    try {
      const objectInfo = await this.getObjectInfoWithRunpodFallback()
      const result = extractModels(objectInfo.data)
      log.info('Models fetched', {
        source: objectInfo.source,
        diffusionModels: result.diffusionModels.length,
        textEncoders: result.textEncoders.length,
        vaes: result.vaes.length,
        upscaleModels: result.upscaleModels.length,
        clipVisions: result.clipVisions.length
      })
      return result
    } catch (error) {
      log.error('Failed to fetch model list', { error: error instanceof Error ? error.message : String(error) })
      return { diffusionModels: [], textEncoders: [], vaes: [], upscaleModels: [], clipVisions: [], ggufClips: [], clipEmbeddings: [], kjVaes: [], latentUpscalers: [], vfiCheckpoints: [] }
    }
  }

  private async getObjectInfoWithRunpodFallback(): Promise<{ data: Record<string, unknown>; source: string }> {
    const activeRunpodServers = await this.serverManager.checkActiveRunpodServers()

    if (activeRunpodServers.length > 0) {
      try {
        const data = await fetchRunpodObjectInfo(activeRunpodServers[0])
        return { data, source: `runpod:${activeRunpodServers[0]}` }
      } catch (error) {
        log.warn('Runpod fetch failed, fallback to local', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    const data = await this.getObjectInfo()
    return { data, source: 'local' }
  }

  private async isUsingRunpod(): Promise<boolean> {
    const servers = await this.serverManager.checkActiveRunpodServers()
    return servers.length > 0
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    const headers: Record<string, string> = { ...options.headers as Record<string, string> }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const fullUrl = `${this.baseURL}${endpoint}`

    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(
        `ComfyUI API 오류: ${response.status} ${response.statusText}`
      )
    }

    const responseText = await response.text()
    if (!responseText || responseText.trim() === '') {
      throw new Error('ComfyUI 서버에서 빈 응답을 받았습니다.')
    }

    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      log.error('ComfyUI JSON parse error', {
        endpoint,
        responseText: responseText.substring(0, 200),
        error: parseError instanceof Error ? parseError.message : String(parseError)
      })
      throw new Error('ComfyUI 서버 응답을 파싱할 수 없습니다.')
    }
  }
}
