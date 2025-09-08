import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'
import type { ComfyUIHistoryResponse, DownloadedMedia } from './client-types'

export class ComfyUIMediaManager {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const response = await this.makeRequest<{ name: string }>('/upload/image', {
        method: 'POST',
        body: formData,
      })
      
      logger.logComfyUIEvent('Image uploaded successfully', { filename: response.name, size: file.size })
      return response.name
    } catch (error) {
      console.error('❌ ComfyUI 이미지 업로드 실패:', error)
      throw new Error(`이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  async getHistory(promptId?: string): Promise<ComfyUIHistoryResponse> {
    try {
      const endpoint = promptId ? `/history/${promptId}` : '/history'
      const response = await this.makeRequest<ComfyUIHistoryResponse>(endpoint)
      return response
    } catch (error) {
      console.error('ComfyUI 히스토리 조회 실패:', error)
      throw error
    }
  }

  async downloadMediaFromHistory(promptId: string): Promise<DownloadedMedia[]> {
    try {
      const history = await this.getHistory(promptId)
      const promptData = history[promptId]
      
      if (!promptData || !promptData.outputs) {
        throw new Error(`프롬프트 ${promptId}에서 출력 데이터를 찾을 수 없습니다`)
      }

      const downloadedFiles: DownloadedMedia[] = []
      const tempDir = join(process.cwd(), 'public', 'temp')
      
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true })
      }

      for (const [, output] of Object.entries(promptData.outputs)) {
        if (output.images) {
          for (const image of output.images) {
            const downloaded = await this.downloadFile(image, tempDir, 'image')
            downloadedFiles.push(downloaded)
          }
        }
        
        if (output.gifs) {
          for (const gif of output.gifs) {
            const downloaded = await this.downloadFile(gif, tempDir, 'video')
            downloadedFiles.push(downloaded)
          }
        }
      }

      logger.logComfyUIEvent('Media files downloaded', { promptId, count: downloadedFiles.length })
      return downloadedFiles
    } catch (error) {
      console.error('미디어 다운로드 실패:', error)
      throw error
    }
  }

  private async downloadFile(
    fileInfo: { filename: string; subfolder: string; type: string },
    tempDir: string,
    mediaType: 'image' | 'video'
  ): Promise<DownloadedMedia> {
    const { filename, subfolder, type } = fileInfo
    
    const downloadUrl = `${this.baseURL}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}`
    
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`파일 다운로드 실패: ${response.status} ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    
    const timestamp = Date.now()
    const localFilename = `${timestamp}_${filename}`
    const localPath = join(tempDir, localFilename)
    
    await writeFile(localPath, buffer)
    
    const publicUrl = `/temp/${localFilename}`
    
    return {
      filename: localFilename,
      localPath,
      url: publicUrl,
      type: mediaType
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

    return await response.json()
  }
}