import { useState, useEffect } from 'react'
import { createLogger } from '@/lib/logger'
import { apiClient } from '@/lib/api-client'

const log = createLogger('hook')

export interface ServerInfo {
  type: 'local' | 'runpod'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  queue?: {
    remaining: number
  }
  error?: string
}

export interface ComfyUIStatus {
  servers: ServerInfo[]
  summary: {
    local: {
      active: number
      total: number
    }
    runpod: {
      active: number
      total: number
    }
    totalActive: number
    totalServers: number
  }
  error?: string
  timestamp: string
}

export function useServerStatus() {
  const [serverStatus, setServerStatus] = useState<ComfyUIStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingServerStatus, setIsLoadingServerStatus] = useState(true)

  const fetchServerStatus = async () => {
    setIsLoadingServerStatus(true)
    try {
      const data = await apiClient.get<ComfyUIStatus>('/api/comfyui/status')
      setServerStatus(data)
    } catch (error) {
      if (error instanceof Error && !error.message.includes('503') && !error.message.includes('Service Unavailable')) {
        log.error('Failed to fetch server status', { error: error instanceof Error ? error.message : String(error) })
      }
    } finally {
      setIsLoadingServerStatus(false)
    }
  }

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    await fetchServerStatus()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  const getServerStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500'
      case 'disconnected':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getServerStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '✅'
      case 'disconnected':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return '❓'
    }
  }

  useEffect(() => {
    fetchServerStatus()
  }, [])

  return {
    serverStatus,
    isRefreshing,
    isLoadingServerStatus,
    fetchServerStatus,
    handleRefreshStatus,
    getServerStatusColor,
    getServerStatusIcon,
  }
}
