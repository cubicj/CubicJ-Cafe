import { logger } from '@/lib/logger'
import type { ModelListResponse } from './client-types'

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
      const response = await this.makeRequest<Record<string, unknown>>('/object_info')
      return response
    } catch (error) {
      console.error('ComfyUI object_info 조회 실패:', error)
      throw error
    }
  }

  async getLoRAList(): Promise<string[]> {
    try {
      const activeRunpodServers = await this.serverManager.checkActiveRunpodServers()
      
      if (activeRunpodServers.length > 0) {
        try {
          const runpodLoras = await this.getLoRAListFromRunpod(activeRunpodServers[0])
          logger.logComfyUIEvent('LoRA list fetched from Runpod', { server: activeRunpodServers[0], count: runpodLoras.length })
          return runpodLoras
        } catch (runpodError) {
          logger.warn('Runpod LoRA fetch failed, fallback to local', { error: runpodError })
        }
      }

      return this.getLoRAListFromLocal()
    } catch (error) {
      console.error('❌ LoRA 목록 조회 실패:', error)
      return []
    }
  }

  private async getLoRAListFromLocal(): Promise<string[]> {
    const objectInfo = await this.getObjectInfo()
    
    const possibleLoraNodes = [
      'LoraLoader',
      'LoRALoader',
      'LoraLoaderModelOnly', 
      'Load LoRA',
      'LoRA Loader',
      'Power Lora Loader (rgthree)',
      'LoRA Stack',
      'LoraLoaderStack'
    ]

    for (const nodeName of possibleLoraNodes) {
      const node = objectInfo?.[nodeName] as { input?: { required?: { lora_name?: unknown[] } } }
      if (node?.input?.required?.lora_name) {
        const loraData = node.input.required.lora_name || []
        const loras = Array.isArray(loraData[0]) ? loraData[0] : loraData
        
        const filteredLoras = this.filterWANLoRAs(loras)
        
        if (filteredLoras.length === 0) {
          console.warn('⚠️ WAN 폴더에서 LoRA가 발견되지 않음. 전체 목록 반환')
          return this.filterAllLoRAs(loras)
        }
        
        if (filteredLoras.length > 0) {
          logger.logComfyUIEvent('Local LoRA list fetched', { node: nodeName, count: filteredLoras.length })
          return filteredLoras.sort()
        }
      }
    }

    console.warn('⚠️ 전용 LoRA 노드를 찾을 수 없습니다. 사용 가능한 노드들:', 
      Object.keys(objectInfo || {}).filter(key => 
        key.toLowerCase().includes('lora') || 
        key.toLowerCase().includes('embed')
      )
    )
    
    return []
  }

  private async getLoRAListFromRunpod(serverUrl: string): Promise<string[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${serverUrl}/object_info`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`런포드 서버 응답 오류: ${response.status} ${response.statusText}`)
      }

      const objectInfo = await response.json()
      
      const possibleLoraNodes = [
        'LoraLoader',
        'LoRALoader',
        'LoraLoaderModelOnly', 
        'Load LoRA',
        'LoRA Loader',
        'Power Lora Loader (rgthree)',
        'LoRA Stack',
        'LoraLoaderStack'
      ]

      for (const nodeName of possibleLoraNodes) {
        const node = objectInfo?.[nodeName] as { input?: { required?: { lora_name?: unknown[] } } }
        if (node?.input?.required?.lora_name) {
          const loraData = node.input.required.lora_name || []
          const loras = Array.isArray(loraData[0]) ? loraData[0] : loraData
          
          const filteredLoras = this.filterWANLoRAs(loras, true)
          
          if (filteredLoras.length === 0) {
            console.warn('⚠️ 런포드 WAN 폴더에서 LoRA가 발견되지 않음. 전체 목록 반환')
            return this.filterAllLoRAs(loras, true)
          }
          
          if (filteredLoras.length > 0) {
            return filteredLoras.sort()
          }
        }
      }

      console.warn('⚠️ 런포드에서 LoRA 노드를 찾을 수 없습니다.')
      return []
    } catch (error) {
      console.error(`❌ 런포드 서버 LoRA 목록 조회 실패: ${serverUrl}:`, error)
      throw error
    }
  }

  private filterWANLoRAs(loras: unknown[], isRunpod = false): string[] {
    return loras
      .filter((file: unknown) => {
        if (typeof file !== 'string') {
          console.warn('⚠️ LoRA 파일명이 문자열이 아닙니다:', typeof file, file)
          return false
        }
        
        const fileName = file.toLowerCase()
        const normalizedPath = file.replace(/\\/g, '/').toLowerCase()
        
        const isInWanFolder = normalizedPath.includes('wan/') || 
                             normalizedPath.startsWith('wan/') ||
                             file.toLowerCase().includes('wan\\') ||
                             file.toLowerCase().startsWith('wan\\')
        
        if (!isInWanFolder) return false
        
        const isLoRAFile = fileName.endsWith('.safetensors') || 
                          fileName.endsWith('.ckpt') || 
                          fileName.endsWith('.pt')
        
        if (!isLoRAFile) return false
        
        if (fileName.includes('checkpoint') && !fileName.includes('lora')) {
          return false
        }
        
        return true
      })
      .map((file: unknown) => {
        const fileStr = file as string
        if (isRunpod || this.isRunpodServer) {
          return fileStr.replace(/\\/g, '/')
        } else {
          return fileStr
        }
      })
  }

  private filterAllLoRAs(loras: unknown[], isRunpod = false): string[] {
    return loras
      .filter((file: unknown) => {
        if (typeof file !== 'string') return false
        const fileName = (file as string).toLowerCase()
        return fileName.endsWith('.safetensors') || fileName.endsWith('.ckpt') || fileName.endsWith('.pt')
      })
      .map((file: unknown) => {
        const fileStr = file as string
        if (isRunpod || this.isRunpodServer) {
          return fileStr.replace(/\\/g, '/')
        } else {
          return fileStr
        }
      })
      .sort()
  }

  async getSamplerList(): Promise<string[]> {
    try {
      const activeRunpodServers = await this.serverManager.checkActiveRunpodServers()
      
      if (activeRunpodServers.length > 0) {
        try {
          const runpodSamplers = await this.getSamplersFromRunpod(activeRunpodServers[0])
          return runpodSamplers
        } catch (runpodError) {
          logger.warn('Runpod sampler fetch failed, fallback to local', { error: runpodError })
        }
      }

      return this.getSamplersFromLocal()
    } catch (error) {
      console.error('❌ 샘플러 목록 조회 실패:', error)
      return []
    }
  }

  private async getSamplersFromLocal(): Promise<string[]> {
    const objectInfo = await this.getObjectInfo()
    
    const ksamplerNodes = [
      'KSampler',
      'KSamplerAdvanced',
      'SamplerCustom',
      'KSamplerSelect',
      'Sampler'
    ]

    for (const nodeName of ksamplerNodes) {
      const node = objectInfo?.[nodeName] as { input?: { required?: { sampler_name?: unknown[] } } }
      if (node?.input?.required?.sampler_name) {
        const samplerData = node.input.required.sampler_name || []
        const samplers = Array.isArray(samplerData[0]) ? samplerData[0] : samplerData
        return samplers.sort()
      }
    }

    console.warn('⚠️ KSampler 노드를 찾을 수 없습니다. 사용 가능한 노드들:', 
      Object.keys(objectInfo || {}).filter(key => 
        key.toLowerCase().includes('sampler') || 
        key.toLowerCase().includes('ksampler')
      )
    )
    
    return []
  }

  private async getSamplersFromRunpod(serverUrl: string): Promise<string[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${serverUrl}/object_info`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`런포드 서버 응답 오류: ${response.status} ${response.statusText}`)
      }

      const objectInfo = await response.json()
      
      const ksamplerNodes = [
        'KSampler',
        'KSamplerAdvanced', 
        'SamplerCustom',
        'KSamplerSelect',
        'Sampler'
      ]

      for (const nodeName of ksamplerNodes) {
        const node = objectInfo?.[nodeName] as { input?: { required?: { sampler_name?: unknown[] } } }
        if (node?.input?.required?.sampler_name) {
          const samplerData = node.input.required.sampler_name || []
          const samplers = Array.isArray(samplerData[0]) ? samplerData[0] : samplerData
          return samplers.sort()
        }
      }

      console.warn('⚠️ 런포드에서 KSampler 노드를 찾을 수 없습니다.')
      return []
    } catch (error) {
      console.error(`❌ 런포드 서버 샘플러 목록 조회 실패: ${serverUrl}:`, error)
      throw error
    }
  }

  async getModelList(): Promise<ModelListResponse> {
    try {
      const activeRunpodServers = await this.serverManager.checkActiveRunpodServers()
      
      if (activeRunpodServers.length > 0) {
        try {
          const runpodResult = await this.getModelListFromRunpod(activeRunpodServers[0])
          return runpodResult
        } catch (runpodError) {
          logger.warn('Runpod model fetch failed, fallback to local', { error: runpodError })
        }
      }

      return this.getModelListFromLocal()
    } catch (error) {
      console.error('❌ 모델 목록 조회 실패:', error)
      return {
        diffusionModels: [],
        textEncoders: [],
        vaes: [],
        upscaleModels: [],
        clipVisions: []
      }
    }
  }

  private async getModelListFromLocal(): Promise<ModelListResponse> {
    const objectInfo = await this.getObjectInfo()
    
    const result: ModelListResponse = {
      diffusionModels: [],
      textEncoders: [],
      vaes: [],
      upscaleModels: [],
      clipVisions: []
    }

    const unetLoader = objectInfo?.UNETLoader as { input?: { required?: { unet_name?: string[] } } }
    if (unetLoader?.input?.required?.unet_name) {
      const unetData = unetLoader.input.required.unet_name
      result.diffusionModels = Array.isArray(unetData[0]) ? unetData[0] : unetData
    }

    const clipLoader = objectInfo?.CLIPLoader as { input?: { required?: { clip_name?: string[] } } }
    if (clipLoader?.input?.required?.clip_name) {
      const clipData = clipLoader.input.required.clip_name
      result.textEncoders = Array.isArray(clipData[0]) ? clipData[0] : clipData
    }

    const vaeLoader = objectInfo?.VAELoader as { input?: { required?: { vae_name?: string[] } } }
    if (vaeLoader?.input?.required?.vae_name) {
      const vaeData = vaeLoader.input.required.vae_name
      result.vaes = Array.isArray(vaeData[0]) ? vaeData[0] : vaeData
    }

    const upscaleLoader = objectInfo?.UpscaleModelLoader as { input?: { required?: { model_name?: string[] } } }
    if (upscaleLoader?.input?.required?.model_name) {
      const upscaleData = upscaleLoader.input.required.model_name
      result.upscaleModels = Array.isArray(upscaleData[0]) ? upscaleData[0] : upscaleData
    }

    const clipVisionLoader = objectInfo?.CLIPVisionLoader as { input?: { required?: { clip_name?: string[] } } }
    if (clipVisionLoader?.input?.required?.clip_name) {
      const clipVisionData = clipVisionLoader.input.required.clip_name
      result.clipVisions = Array.isArray(clipVisionData[0]) ? clipVisionData[0] : clipVisionData
    }

    logger.logComfyUIEvent('Local models fetched', {
      diffusionModels: result.diffusionModels.length,
      textEncoders: result.textEncoders.length,
      vaes: result.vaes.length,
      upscaleModels: result.upscaleModels.length,
      clipVisions: result.clipVisions.length
    })

    return result
  }

  private async getModelListFromRunpod(serverUrl: string): Promise<ModelListResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${serverUrl}/object_info`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`런포드 서버 응답 오류: ${response.status} ${response.statusText}`)
      }

      const objectInfo = await response.json()
      
      const result: ModelListResponse = {
        diffusionModels: [],
        textEncoders: [],
        vaes: [],
        upscaleModels: [],
        clipVisions: []
      }

      const unetLoader = objectInfo?.UNETLoader as { input?: { required?: { unet_name?: string[] } } }
      if (unetLoader?.input?.required?.unet_name) {
        const unetData = unetLoader.input.required.unet_name
        result.diffusionModels = Array.isArray(unetData[0]) ? unetData[0] : unetData
      }

      const clipLoader = objectInfo?.CLIPLoader as { input?: { required?: { clip_name?: string[] } } }
      if (clipLoader?.input?.required?.clip_name) {
        const clipData = clipLoader.input.required.clip_name
        result.textEncoders = Array.isArray(clipData[0]) ? clipData[0] : clipData
      }

      const vaeLoader = objectInfo?.VAELoader as { input?: { required?: { vae_name?: string[] } } }
      if (vaeLoader?.input?.required?.vae_name) {
        const vaeData = vaeLoader.input.required.vae_name
        result.vaes = Array.isArray(vaeData[0]) ? vaeData[0] : vaeData
      }

      const upscaleLoader = objectInfo?.UpscaleModelLoader as { input?: { required?: { model_name?: string[] } } }
      if (upscaleLoader?.input?.required?.model_name) {
        const upscaleData = upscaleLoader.input.required.model_name
        result.upscaleModels = Array.isArray(upscaleData[0]) ? upscaleData[0] : upscaleData
      }

      const clipVisionLoader = objectInfo?.CLIPVisionLoader as { input?: { required?: { clip_name?: string[] } } }
      if (clipVisionLoader?.input?.required?.clip_name) {
        const clipVisionData = clipVisionLoader.input.required.clip_name
        result.clipVisions = Array.isArray(clipVisionData[0]) ? clipVisionData[0] : clipVisionData
      }

      logger.logComfyUIEvent('Runpod models fetched', {
        server: serverUrl,
        diffusionModels: result.diffusionModels.length,
        textEncoders: result.textEncoders.length,
        vaes: result.vaes.length,
        upscaleModels: result.upscaleModels.length,
        clipVisions: result.clipVisions.length
      })

      return result
    } catch (error) {
      console.error(`❌ 런포드 서버 모델 목록 조회 실패: ${serverUrl}:`, error)
      throw error
    }
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

    // JSON 파싱 안전 장치 추가
    const responseText = await response.text()
    if (!responseText || responseText.trim() === '') {
      throw new Error('ComfyUI 서버에서 빈 응답을 받았습니다.')
    }

    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      console.error('ComfyUI JSON 파싱 에러:', {
        endpoint,
        responseText: responseText.substring(0, 200),
        error: parseError
      })
      throw new Error('ComfyUI 서버 응답을 파싱할 수 없습니다.')
    }
  }
}