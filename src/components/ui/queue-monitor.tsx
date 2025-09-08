"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Play, CheckCircle, XCircle, AlertCircle, BarChart3, List, Trash2, RefreshCw } from "lucide-react";
import { isAdmin } from "@/lib/auth/admin";

interface QueueRequest {
  id: string;
  nickname: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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

interface CurrentUser {
  id: string;
  nickname: string;
  discordUsername: string;
  discordId: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  todayCompleted: number;
  total: number;
}

export function QueueMonitor() {
  const [queueList, setQueueList] = useState<QueueRequest[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchQueueData = useCallback(async () => {
    try {
      setError(null);
      
      // 현재 사용자 정보 조회 (최초 1회만)
      if (!currentUser) {
        try {
          const userResponse = await fetch('/api/auth/session');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData.user);
          }
        } catch (userErr) {
          console.warn('사용자 정보 조회 실패:', userErr);
        }
      }
      
      // 전체 큐 리스트 조회
      try {
        const queueResponse = await fetch('/api/queue?action=list');
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          setQueueList(queueData.data || []);
        } else {
          console.warn('큐 리스트 조회 실패:', queueResponse.status);
        }
      } catch (queueErr) {
        console.warn('큐 리스트 fetch 에러:', queueErr);
      }

      // 큐 통계 조회
      try {
        const statsResponse = await fetch('/api/queue?action=stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        } else {
          console.warn('큐 통계 조회 실패:', statsResponse.status);
        }
      } catch (statsErr) {
        console.warn('큐 통계 fetch 에러:', statsErr);
      }

    } catch (err) {
      console.error('Queue 데이터 조회 전체 실패:', err);
      setError('큐 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);


  // 큐 삭제 함수
  const handleDeleteQueue = async (requestId: string, nickname: string) => {
    if (!confirm(`"${nickname}"님의 요청을 취소하시겠습니까?`)) {
      return;
    }

    setDeletingIds(prev => new Set([...prev, requestId]));

    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          requestId: requestId,
        }),
      });

      if (response.ok) {
        // 성공시 즉시 큐 데이터 새로고침
        await fetchQueueData();
      } else {
        const errorData = await response.json();
        alert(`삭제 실패: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('큐 삭제 오류:', error);
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // 사용자가 삭제 가능한지 확인
  const canDeleteRequest = (request: QueueRequest): boolean => {
    if (!currentUser) return false;
    if (request.status === 'COMPLETED' || request.status === 'FAILED' || request.status === 'CANCELLED') {
      return false;
    }
    // 관리자는 모든 요청을 삭제할 수 있음
    if (isAdmin(currentUser.discordId)) {
      return true;
    }
    // 일반 사용자는 본인 요청만 삭제 가능
    return request.nickname === currentUser.nickname;
  };

  useEffect(() => {
    fetchQueueData();
    
    // 5초마다 자동 새로고침
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'PROCESSING': return <Play className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'FAILED': return <XCircle className="h-4 w-4" />;
      case 'CANCELLED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'PROCESSING': return 'default';
      case 'COMPLETED': return 'outline';
      case 'FAILED': return 'destructive';
      case 'CANCELLED': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '대기중';
      case 'PROCESSING': return '처리중';
      case 'COMPLETED': return '완료';
      case 'FAILED': return '실패';
      case 'CANCELLED': return '취소됨';
      default: return status;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

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

  // 데이터가 없어도 UI를 표시하고, 부분적으로만 에러 표시
  const hasAnyData = queueList.length > 0 || stats;

  return (
    <div className="space-y-6">
      {/* 큐 통계 */}
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
        <Card className="p-6">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
              <div className="text-xs text-muted-foreground">대기중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
              <div className="text-xs text-muted-foreground">처리중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.todayCompleted || 0}</div>
              <div className="text-xs text-muted-foreground">오늘 완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.total || 0}</div>
              <div className="text-xs text-muted-foreground">전체 대기</div>
            </div>
          </div>
          
          {!stats && (
            <div className="text-center text-sm text-muted-foreground mt-2">
              통계 데이터를 불러오는 중...
            </div>
          )}
        </Card>
      </div>

      {error && !hasAnyData && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-700">{error}</div>
        </Card>
      )}

      {/* 전체 큐 리스트 */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <List className="h-5 w-5" />
          전체 실행 큐
        </h2>
        <Card className="p-6">
          {queueList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? "큐 데이터를 불러오는 중..." : "현재 실행 대기 중인 요청이 없습니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {queueList.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      #{request.position}
                    </Badge>
                    <Badge 
                      variant={getStatusColor(request.status) as "default" | "secondary" | "destructive" | "outline"}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(request.status)}
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{request.nickname}</span>
                    {currentUser && request.nickname === currentUser.nickname && (
                      <Badge variant="secondary" className="text-xs">
                        내 요청
                      </Badge>
                    )}
                    {currentUser && isAdmin(currentUser.discordId) && request.nickname !== currentUser.nickname && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                        관리자 권한
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ellipsis overflow-hidden whitespace-nowrap" title={request.prompt}>
                      {request.prompt}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-xs text-muted-foreground min-w-16">
                      {formatRelativeTime(request.createdAt)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                    {request.error && (
                      <div className="text-xs text-red-600 max-w-xs truncate" title={request.error}>
                        {request.error}
                      </div>
                    )}
                    
                    {canDeleteRequest(request) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQueue(request.id, request.nickname)}
                        disabled={deletingIds.has(request.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        {deletingIds.has(request.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}