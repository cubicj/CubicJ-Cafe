import { useState, useEffect } from 'react'

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
      const response = await fetch('/api/comfyui/status')
      if (response.ok) {
        const data = await response.json()
        setServerStatus(data)
      }
    } catch (error) {
      console.error('서버 상태 조회 실패:', error)
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