'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, ImagePlus, Repeat, Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

const MODEL_CONFIG: Record<string, { label: string; className: string }> = {
  wan: { label: 'WAN', className: 'bg-purple-100 text-purple-700 border-purple-300' },
  ltx: { label: 'LTX', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  ltx_wan: { label: 'L+W', className: 'bg-teal-100 text-teal-700 border-teal-300' },
};

function getModelConfig(videoModel: string) {
  return MODEL_CONFIG[videoModel] ?? { label: videoModel.toUpperCase(), className: 'bg-gray-100 text-gray-700 border-gray-300' };
}

function parseLoraPresetName(loraPresetData?: string): string | null {
  if (!loraPresetData) return null;
  try {
    const parsed = JSON.parse(loraPresetData);
    return parsed.presetName || null;
  } catch {
    return null;
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

function formatAbsoluteTime(dateString: string) {
  return new Date(dateString).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const MODE_CONFIG: Record<string, { label: string; className: string }> = {
  START_ONLY: { label: 'Base', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  START_END: { label: 'Base+End', className: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  LOOP: { label: 'Loop', className: 'bg-amber-100 text-amber-700 border-amber-300' },
};

function getModeConfig(generationMode: string) {
  return MODE_CONFIG[generationMode] ?? MODE_CONFIG.START_ONLY;
}

function DeleteButton({ isDeleting, onClick }: { isDeleting: boolean; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isDeleting}
      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
    >
      {isDeleting ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
    </Button>
  );
}

function QueueDetailDialog({ request, isCurrentUser, canDelete, isDeleting, onDelete }: QueueItemProps) {
  const modelConfig = getModelConfig(request.videoModel);
  const loraName = parseLoraPresetName(request.loraPresetData);

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">#{request.position}</Badge>
          <Badge
            variant={getStatusBadgeVariant(request.status)}
            className="flex items-center gap-1"
          >
            {getStatusIcon(request.status)}
            {getStatusText(request.status)}
          </Badge>
          <span>{request.nickname}</span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs">내 요청</Badge>
          )}
        </DialogTitle>
        <DialogDescription className="sr-only">Queue request detail</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-sm">
        <div>
          <div className="font-medium text-xs text-muted-foreground mb-1">프롬프트</div>
          <p className="p-2 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">{request.prompt}</p>
        </div>

        <div>
          <div className="font-medium text-xs text-muted-foreground mb-1">생성 정보</div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs ${modelConfig.className}`}>
              {modelConfig.label}
            </Badge>
            <Badge variant="outline" className={`text-xs ${getModeConfig(request.generationMode).className}`}>
              {getModeConfig(request.generationMode).label}
            </Badge>
            <span>{request.videoDuration}초</span>
          </div>
        </div>

        {(loraName || request.audioPresetName || request.isNSFW) && (
          <div>
            <div className="font-medium text-xs text-muted-foreground mb-1">옵션</div>
            <div className="space-y-1">
              {loraName && <div>LoRA: {loraName}</div>}
              {request.audioPresetName && <div>오디오: {request.audioPresetName}</div>}
              {request.isNSFW && <Badge variant="destructive" className="text-xs">NSFW</Badge>}
            </div>
          </div>
        )}

        <div>
          <div className="font-medium text-xs text-muted-foreground mb-1">시간</div>
          <div className="space-y-1 text-xs">
            <div>등록: {formatAbsoluteTime(request.createdAt)}</div>
            {request.startedAt && <div>시작: {formatAbsoluteTime(request.startedAt)}</div>}
            {request.completedAt && <div>완료: {formatAbsoluteTime(request.completedAt)}</div>}
            {request.failedAt && <div>실패: {formatAbsoluteTime(request.failedAt)}</div>}
          </div>
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
  );
}

export function QueueItem({ request, isCurrentUser, canDelete, isDeleting, onDelete }: QueueItemProps) {
  const modelConfig = getModelConfig(request.videoModel);

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
          <span className="font-medium">{request.nickname}</span>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs">내 요청</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs ${modelConfig.className}`}>
            {modelConfig.label}
          </Badge>
          {request.generationMode === 'START_END' && (
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
          )}
          {request.generationMode === 'LOOP' && (
            <Repeat className="h-4 w-4 text-muted-foreground" />
          )}
          {request.audioFile && (
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-muted-foreground min-w-16">
            {formatRelativeTime(request.createdAt)}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <QueueDetailDialog
              request={request}
              isCurrentUser={isCurrentUser}
              canDelete={canDelete}
              isDeleting={isDeleting}
              onDelete={onDelete}
            />
          </Dialog>

          {canDelete && (
            <DeleteButton
              isDeleting={isDeleting}
              onClick={() => onDelete(request.id, request.nickname)}
            />
          )}
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
          <QueueDetailDialog
            request={request}
            isCurrentUser={isCurrentUser}
            canDelete={canDelete}
            isDeleting={isDeleting}
            onDelete={onDelete}
          />
        </Dialog>

        {canDelete && (
          <DeleteButton
            isDeleting={isDeleting}
            onClick={() => onDelete(request.id, request.nickname)}
          />
        )}
      </div>
    </>
  );
}
