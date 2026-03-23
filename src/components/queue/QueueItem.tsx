'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Play, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

interface QueueRequest {
  id: string;
  nickname: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  prompt: string;
  position: number;
  createdAt: string;
  error?: string;
}

interface QueueItemProps {
  request: QueueRequest;
  isCurrentUser: boolean;
  isAdminUser: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: (requestId: string, nickname: string) => void;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING': return <Clock className="h-4 w-4" />;
    case 'PROCESSING': return <Play className="h-4 w-4" />;
    case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
    case 'FAILED': return <XCircle className="h-4 w-4" />;
    case 'CANCELLED': return <AlertCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'secondary';
    case 'PROCESSING': return 'default';
    case 'COMPLETED': return 'outline';
    case 'FAILED': return 'destructive';
    case 'CANCELLED': return 'outline';
    default: return 'secondary';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'PENDING': return '대기중';
    case 'PROCESSING': return '처리중';
    case 'COMPLETED': return '완료';
    case 'FAILED': return '실패';
    case 'CANCELLED': return '취소됨';
    default: return status;
  }
}

function formatRelativeTime(dateString: string) {
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
}

export function QueueItem({ request, isCurrentUser, isAdminUser, canDelete, isDeleting, onDelete }: QueueItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
        {isCurrentUser && (
          <Badge variant="secondary" className="text-xs">
            내 요청
          </Badge>
        )}
        {isAdminUser && !isCurrentUser && (
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

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(request.id, request.nickname)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
