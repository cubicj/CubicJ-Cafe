"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { useSession } from '@/contexts/SessionContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, List, RefreshCw } from "lucide-react";
import { QueueStats } from "@/components/queue/QueueStats";
import { QueueItem } from "@/components/queue/QueueItem";
import { PauseBanner } from "@/components/queue/PauseBanner";

const log = createLogger('ui');

interface QueueRequest {
  id: string;
  nickname: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERROR' | 'FAILED' | 'CANCELLED';
  prompt: string;
  position: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  user: {
    nickname: string;
    avatar?: string;
  };
}

interface QueueStatsData {
  pending: number;
  processing: number;
  todayCompleted: number;
  total: number;
}

export function QueueMonitor() {
  const { user: currentUser, isAdmin: isCurrentUserAdmin } = useSession();
  const [queueList, setQueueList] = useState<QueueRequest[]>([]);
  const [stats, setStats] = useState<QueueStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [pauseAfterPosition, setPauseAfterPosition] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('queuePauseAfterPosition');
    return cached ? Number(cached) : null;
  });
  const [removingPause, setRemovingPause] = useState(false);


  const fetchQueueData = useCallback(async () => {
    try {
      setError(null);

      const [queueResult, statsResult] = await Promise.all([
        apiClient.get<{ data: QueueRequest[]; pauseAfterPosition?: number }>('/api/queue?action=list').catch(() => null),
        apiClient.get<{ data: QueueStatsData }>('/api/queue?action=stats').catch(() => null),
      ]);

      if (queueResult) {
        setQueueList(queueResult.data || []);
        const pause = queueResult.pauseAfterPosition ?? null;
        setPauseAfterPosition(pause);
        if (pause !== null) {
          localStorage.setItem('queuePauseAfterPosition', String(pause));
        } else {
          localStorage.removeItem('queuePauseAfterPosition');
        }
      }
      if (statsResult) {
        setStats(statsResult.data);
      }

    } catch (err) {
      log.error('Queue data fetch failed', { error: err instanceof Error ? err.message : String(err) });
      setError('큐 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteQueue = async (requestId: string, nickname: string) => {
    if (!confirm(`"${nickname}"님의 요청을 취소하시겠습니까?`)) return;

    setDeletingIds(prev => new Set([...prev, requestId]));
    try {
      await apiClient.post('/api/queue', { action: 'cancel', requestId });
      await fetchQueueData();
    } catch (error) {
      log.error('Queue delete error', { error: error instanceof Error ? error.message : String(error) });
      alert(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRemovePause = async () => {
    setRemovingPause(true);
    try {
      await apiClient.delete('/api/admin/queue-pause');
      setPauseAfterPosition(null);
    } catch {
    } finally {
      setRemovingPause(false);
    }
  };

  const canDeleteRequest = (request: QueueRequest): boolean => {
    if (!currentUser) return false;
    if (['COMPLETED', 'COMPLETED_WITH_ERROR', 'FAILED', 'CANCELLED'].includes(request.status)) return false;
    if (isCurrentUserAdmin) return true;
    return request.nickname === currentUser.nickname;
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">큐 정보를 불러오는 중...</span>
        </div>
      </Card>
    );
  }

  const hasAnyData = queueList.length > 0 || stats;
  const showTopPauseBanner = pauseAfterPosition !== null && !queueList.some(item => item.position === pauseAfterPosition);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            실행 큐 현황
          </h2>
          <Button variant="outline" size="sm" onClick={fetchQueueData} className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            새로고침
          </Button>
        </div>
        <QueueStats stats={stats} />
      </div>

      {error && !hasAnyData && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-700">{error}</div>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <List className="h-5 w-5" />
          전체 실행 큐
        </h2>
        <Card className="p-6">
          {showTopPauseBanner && (
            <PauseBanner
              position={pauseAfterPosition}
              canManage={isCurrentUserAdmin}
              removing={removingPause}
              onRemove={handleRemovePause}
            />
          )}
          {queueList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? "큐 데이터를 불러오는 중..." : "현재 실행 대기 중인 요청이 없습니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {queueList.map((request) => (
                <React.Fragment key={request.id}>
                  <QueueItem
                    request={request}
                    isCurrentUser={currentUser?.nickname === request.nickname}
                    canDelete={canDeleteRequest(request)}
                    isDeleting={deletingIds.has(request.id)}
                    onDelete={handleDeleteQueue}
                  />
                  {request.position === pauseAfterPosition && (
                    <PauseBanner
                      position={pauseAfterPosition}
                      isInline
                      canManage={isCurrentUserAdmin}
                      removing={removingPause}
                      onRemove={handleRemovePause}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
