'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getStatusIcon, getStatusBadgeVariant, getStatusText, getStatusBadgeColor } from '@/lib/queue-status';

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
  videoModel: string;
  generationMode: string;
  videoDuration: number;
  endImageFile?: string;
  audioFile?: string;
  audioPresetName?: string;
  loraPresetData?: string;
  isNSFW: boolean;
}

interface QueueItemProps {
  request: QueueRequest;
  isCurrentUser: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: (requestId: string, nickname: string) => void;
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


export function QueueItem({ request, isCurrentUser, canDelete, isDeleting, onDelete }: QueueItemProps) {
  return (
    <>
      <div className="hidden md:flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs">
            #{request.position}
          </Badge>
          <Badge
            variant={getStatusBadgeVariant(request.status)}
            className="flex items-center gap-1"
          >
            {getStatusIcon(request.status)}
            {getStatusText(request.status)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{request.nickname}</span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs">
              내 요청
            </Badge>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-ellipsis overflow-hidden whitespace-nowrap" title={request.prompt}>
            {request.prompt}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
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

      <div className="flex md:hidden items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Badge className={`text-xs ${getStatusBadgeColor(request.status)}`}>
          #{request.position}
        </Badge>

        {getStatusIcon(request.status)}

        <span className="font-medium text-sm truncate flex-1 min-w-0">{request.nickname}</span>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">#{request.position}</Badge>
                <Badge
                  variant={getStatusBadgeVariant(request.status)}
                  className="flex items-center gap-1"
                >
                  {getStatusIcon(request.status)}
                  {getStatusText(request.status)}
                </Badge>
                <span>{request.nickname}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs">내 요청</Badge>
              )}

              <div>
                <div className="font-medium text-xs text-muted-foreground mb-1">프롬프트</div>
                <p className="p-2 bg-muted/50 rounded text-sm">{request.prompt}</p>
              </div>

              <div>
                <div className="font-medium text-xs text-muted-foreground mb-1">등록 시간</div>
                <p>{formatRelativeTime(request.createdAt)}</p>
              </div>

              {request.error && (
                <div>
                  <div className="font-medium text-xs text-muted-foreground mb-1">오류</div>
                  <p className="p-2 bg-red-50 rounded text-sm text-red-700">{request.error}</p>
                </div>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => onDelete(request.id, request.nickname)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  삭제
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(request.id, request.nickname)}
            disabled={isDeleting}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </>
  );
}
