import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

export async function comfyuiFetch<T>(
  baseURL: string,
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const headers: Record<string, string> = { ...options.headers as Record<string, string> }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const fullUrl = `${baseURL}${endpoint}`

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
