import { useEffect, useState, useRef, useCallback } from 'react'
// env removed - using process.env directly

export interface ComfyUIProgressEvent {
  type: 'progress'
  data: {
    value: number
    max: number
    prompt_id?: string
    node?: string
  }
}

export interface ComfyUIExecutionEvent {
  type: 'execution_start' | 'execution_success' | 'execution_error' | 'execution_cached' | 'executing'
  data: {
    prompt_id?: string
    node?: string
    display_node?: string
    output?: Record<string, unknown>
    exception_message?: string
    exception_type?: string
    traceback?: string[]
  }
}

export interface ComfyUIQueueEvent {
  type: 'status'
  data: {
    status: {
      exec_info: {
        queue_remaining: number
      }
    }
    sid?: string
  }
}

export type ComfyUIWebSocketEvent = ComfyUIProgressEvent | ComfyUIExecutionEvent | ComfyUIQueueEvent

export interface UseComfyUIWebSocketOptions {
  clientId?: string
  onProgress?: (progress: { value: number; max: number; percentage: number }) => void
  onStatusChange?: (status: 'idle' | 'executing' | 'completed' | 'error') => void
  onError?: (error: Error) => void
  autoReconnect?: boolean
  maxReconnectAttempts?: number
}

export interface UseComfyUIWebSocketReturn {
  isConnected: boolean
  currentStatus: 'idle' | 'executing' | 'completed' | 'error'
  currentProgress: { value: number; max: number; percentage: number } | null
  queueRemaining: number
  lastError: string | null
  reconnect: () => void
  disconnect: () => void
}

export function useComfyUIWebSocket(options: UseComfyUIWebSocketOptions = {}): UseComfyUIWebSocketReturn {
  const {
    clientId,
    onProgress,
    onStatusChange,
    onError,
    autoReconnect = true,
    maxReconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'executing' | 'completed' | 'error'>('idle')
  const [currentProgress, setCurrentProgress] = useState<{ value: number; max: number; percentage: number } | null>(null)
  const [queueRemaining, setQueueRemaining] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(true)

  const getWebSocketURL = useCallback(() => {
    const baseURL = (process.env.COMFYUI_API_URL || 'http://localhost:8188').replace(/^https?:\/\//, '')
    const wsURL = `ws://${baseURL}/ws`
    return clientId ? `${wsURL}?clientId=${clientId}` : wsURL
  }, [clientId])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: ComfyUIWebSocketEvent = JSON.parse(event.data)
      
      switch (message.type) {
        case 'progress':
          const { value, max } = message.data
          const percentage = max > 0 ? Math.round((value / max) * 100) : 0
          const progressData = { value, max, percentage }
          
          setCurrentProgress(progressData)
          onProgress?.(progressData)
          
          if (currentStatus !== 'executing') {
            setCurrentStatus('executing')
            onStatusChange?.('executing')
          }
          break

        case 'execution_start':
          setCurrentStatus('executing')
          setCurrentProgress({ value: 0, max: 100, percentage: 0 })
          setLastError(null)
          onStatusChange?.('executing')
          break

        case 'execution_success':
          setCurrentStatus('completed')
          setCurrentProgress({ value: 100, max: 100, percentage: 100 })
          onStatusChange?.('completed')
          break

        case 'execution_error':
          const errorMessage = message.data.exception_message || 'ComfyUI 실행 오류'
          setCurrentStatus('error')
          setLastError(errorMessage)
          setCurrentProgress(null)
          onStatusChange?.('error')
          onError?.(new Error(errorMessage))
          break

        case 'executing':
          if (message.data.node) {
            setCurrentStatus('executing')
            onStatusChange?.('executing')
          }
          break

        case 'status':
          if (message.data.status?.exec_info) {
            setQueueRemaining(message.data.status.exec_info.queue_remaining)
          }
          break

        default:
          console.log('ComfyUI WebSocket 알 수 없는 메시지:', message)
      }
    } catch (error) {
      console.error('ComfyUI WebSocket 메시지 파싱 오류:', error)
    }
  }, [currentStatus, onProgress, onStatusChange, onError])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const wsURL = getWebSocketURL()
      console.log('ComfyUI WebSocket 연결 시도:', wsURL)
      
      wsRef.current = new WebSocket(wsURL)

      wsRef.current.onopen = () => {
        console.log('ComfyUI WebSocket 연결 성공')
        setIsConnected(true)
        setLastError(null)
        reconnectAttemptsRef.current = 0
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      wsRef.current.onmessage = handleMessage

      wsRef.current.onclose = (event) => {
        console.log('ComfyUI WebSocket 연결 종료:', event.code, event.reason)
        setIsConnected(false)
        
        if (shouldReconnectRef.current && autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`ComfyUI WebSocket 재연결 시도 ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} (${delay}ms 후)`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('ComfyUI WebSocket 오류:', error)
        const errorMsg = 'ComfyUI WebSocket 연결 오류'
        setLastError(errorMsg)
        onError?.(new Error(errorMsg))
      }

    } catch (error) {
      console.error('ComfyUI WebSocket 연결 실패:', error)
      const errorMsg = `WebSocket 연결 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      setLastError(errorMsg)
      onError?.(new Error(errorMsg))
    }
  }, [getWebSocketURL, handleMessage, autoReconnect, maxReconnectAttempts, onError])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setCurrentStatus('idle')
    setCurrentProgress(null)
    setQueueRemaining(0)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    shouldReconnectRef.current = true
    reconnectAttemptsRef.current = 0
    setTimeout(connect, 100)
  }, [disconnect, connect])

  useEffect(() => {
    shouldReconnectRef.current = true
    connect()

    return () => {
      shouldReconnectRef.current = false
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    currentStatus,
    currentProgress,
    queueRemaining,
    lastError,
    reconnect,
    disconnect,
  }
}