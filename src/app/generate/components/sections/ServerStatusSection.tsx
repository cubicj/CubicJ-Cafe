"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Clock, AlertCircle, Cpu, Cloud, CheckCircle, RefreshCw } from "lucide-react";

interface ServerInfo {
  type: 'local' | 'runpod'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  queue?: {
    remaining: number
  }
  error?: string
}

interface ComfyUIStatus {
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

interface ServerStatusSectionProps {
  serverStatus: ComfyUIStatus | null;
  isRefreshing: boolean;
  isLoadingServerStatus: boolean;
  onRefreshStatus: () => Promise<void>;
}

export function ServerStatusSection({
  serverStatus,
  isRefreshing,
  isLoadingServerStatus,
  onRefreshStatus,
}: ServerStatusSectionProps) {
  const getServerStatusColor = (serverStatus: string) => {
    switch (serverStatus) {
      case 'connected': return 'default'
      case 'disconnected': return 'secondary'
      case 'error': return 'destructive'
      default: return 'secondary'
    }
  }

  const getServerStatusIcon = (serverStatus: string) => {
    switch (serverStatus) {
      case 'connected': return <CheckCircle className="h-3 w-3" />
      case 'disconnected': return <AlertCircle className="h-3 w-3" />
      case 'error': return <AlertCircle className="h-3 w-3" />
      default: return <Server className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Server className="h-4 w-4" />
          ComfyUI 서버 상태
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshStatus}
          disabled={isRefreshing || isLoadingServerStatus}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing || isLoadingServerStatus ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>
      <Card className="p-6">
        {isLoadingServerStatus ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <span>서버 상태를 확인하는 중...</span>
          </div>
        ) : !serverStatus ? (
          <div className="text-center py-8 text-muted-foreground">
            서버 상태를 불러올 수 없습니다.
          </div>
        ) : serverStatus?.summary ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={serverStatus.summary?.totalActive > 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
                <Server className="h-3 w-3" />
                {serverStatus.summary?.totalActive || 0}/{serverStatus.summary?.totalServers || 0} 활성
              </Badge>
              {serverStatus.servers?.some(s => s.queue && s.queue.remaining > 0) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  작업 대기 중
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">로컬 서버</span>
                  <Badge variant="outline" className="text-xs">
                    {serverStatus.summary?.local.active || 0}/{serverStatus.summary?.local.total || 0}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {serverStatus.servers?.filter(s => s.type === 'local').map((server, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={getServerStatusColor(server.status)} className="text-xs flex items-center gap-1">
                          {getServerStatusIcon(server.status)}
                          {server.name}
                        </Badge>
                        {server.queue && server.queue.remaining > 0 && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            대기: {server.queue.remaining}개
                          </span>
                        )}
                      </div>
                      {server.error && (
                        <span className="text-xs text-red-600 dark:text-red-400">{server.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(serverStatus.summary?.runpod.total || 0) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Runpod 서버</span>
                    <Badge variant="outline" className="text-xs">
                      {serverStatus.summary?.runpod.active || 0}/{serverStatus.summary?.runpod.total || 0}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {serverStatus.servers?.filter(s => s.type === 'runpod').map((server, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={getServerStatusColor(server.status)} className="text-xs flex items-center gap-1">
                            {getServerStatusIcon(server.status)}
                            {server.name}
                          </Badge>
                          {server.queue && server.queue.remaining > 0 && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              대기: {server.queue.remaining}개
                            </span>
                          )}
                        </div>
                        {server.error && (
                          <span className="text-xs text-red-600 dark:text-red-400">{server.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              마지막 확인: {serverStatus.timestamp ? new Date(serverStatus.timestamp).toLocaleTimeString('ko-KR') : '알 수 없음'}
            </div>

            {(serverStatus.summary?.totalActive || 0) > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                ✓ {serverStatus.summary?.totalActive || 0}개의 서버가 활성화되어 있습니다. 비디오 생성이 가능합니다.
              </div>
            )}
            
            {(serverStatus.summary?.totalActive || 0) === 0 && (serverStatus.summary?.totalServers || 0) > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                ⚠️ 모든 서버가 비활성 상태입니다. 비디오 생성이 일시적으로 불가능합니다.
              </div>
            )}

            {(serverStatus.summary?.totalActive || 0) === 0 && (serverStatus.summary?.totalServers || 0) === 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                ❌ 사용 가능한 서버가 없습니다. 관리자에게 문의하세요.
              </div>
            )}
            
            {serverStatus?.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                ❌ 서버 상태 확인 중 오류가 발생했습니다.
              </div>
            )}
            </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            서버 상태 데이터가 올바르지 않습니다.
          </div>
        )}
      </Card>
    </div>
  );
}