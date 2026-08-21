'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, ImagePlus, ImageDown, Repeat, Layers, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BADGE_TONES } from '@/lib/badge-palette';
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import type { VideoModel } from '@/lib/comfyui/workflows/types';
import { getStatusIcon, getStatusBadgeVariant, getStatusText, getStatusBadgeColor } from '@/lib/queue-status';
import { cn } from '@/lib/utils';
import { getQueueDetailTags, getQueueDisplayDurationSeconds } from './queue-detail-tags';

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
  videoDurationSeconds?: number | null;
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

interface QueueDetailDialogProps extends QueueItemProps {
  loraName: string | null;
}

const MODEL_CONFIG: Record<string, { label: string; className: string }> = {
  wan: { label: 'WAN 2.2', className: BADGE_TONES.purple },
  ltxa: { label: 'LTX(Anime)', className: BADGE_TONES.blue },
  ltxr: { label: 'LTX(Real)', className: BADGE_TONES.emerald },
  ltx: { label: 'LTX(Anime)', className: BADGE_TONES.blue },
  'ltx-wan': { label: 'LTX + WAN', className: BADGE_TONES.teal },
  'h3-fl2va': { label: 'H3 FL2VA', className: BADGE_TONES.rose },
  'h3-ref2va': { label: 'H3 Ref2VA', className: BADGE_TONES.orange },
};

function getModelConfig(videoModel: string) {
  return MODEL_CONFIG[videoModel] ?? { label: videoModel.toUpperCase(), className: BADGE_TONES.gray };
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

export function formatAbsoluteTime(dateString: string) {
  const d = new Date(dateString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const MODE_CONFIG: Record<string, { label: string; className: string }> = {
  START_ONLY: { label: 'Base', className: BADGE_TONES.gray },
  START_END: { label: 'Base+End', className: BADGE_TONES.indigo },
  END_ONLY: { label: 'End', className: BADGE_TONES.cyan },
  LOOP: { label: 'Loop', className: BADGE_TONES.amber },
  REFERENCE: { label: 'Ref', className: BADGE_TONES.violet },
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

function QueueDetailDialog({ request, isCurrentUser, canDelete, isDeleting, onDelete, loraName }: QueueDetailDialogProps) {
  const modelConfig = getModelConfig(request.videoModel);
  const modeConfig = getModeConfig(request.generationMode);
  const detailTags = getQueueDetailTags({
    modelLabel: modelConfig.label,
    modelClassName: modelConfig.className,
    modeLabel: modeConfig.label,
    modeClassName: modeConfig.className,
    durationSeconds: getQueueDisplayDurationSeconds(request.videoDuration, request.videoDurationSeconds),
    isNSFW: request.isNSFW,
    loraName,
    audioPresetName: request.audioPresetName,
  });

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono text-xs">#{request.position}</Badge>
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
          <p className="p-2 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto whitespace-pre-wrap wrap-break-word">{request.prompt}</p>
        </div>

        <div>
          <div className="font-medium text-xs text-muted-foreground mb-1">태그</div>
          <div className="flex flex-wrap gap-1.5">
            {detailTags.map((tag) => (
              <Badge
                key={tag.key}
                variant={tag.variant}
                className={cn('text-xs max-w-full min-w-0', tag.className)}
              >
                <span className="truncate">{tag.label}</span>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="font-medium text-xs text-muted-foreground mb-1">시간</div>
          <div className="p-2 bg-muted/50 rounded space-y-1 text-sm">
            <div className="flex items-center"><span className="w-8 shrink-0 text-xs text-muted-foreground font-medium">등록:</span> <Badge variant="outline" className="font-mono text-xs">{formatAbsoluteTime(request.createdAt)}</Badge></div>
            {request.startedAt && <div className="flex items-center"><span className="w-8 shrink-0 text-xs text-muted-foreground font-medium">시작:</span> <Badge variant="outline" className="font-mono text-xs">{formatAbsoluteTime(request.startedAt)}</Badge></div>}
            {request.completedAt && <div className="flex items-center"><span className="w-8 shrink-0 text-xs text-muted-foreground font-medium">완료:</span> <Badge variant="outline" className="font-mono text-xs">{formatAbsoluteTime(request.completedAt)}</Badge></div>}
            {request.failedAt && <div className="flex items-center"><span className="w-8 shrink-0 text-xs text-muted-foreground font-medium">실패:</span> <Badge variant="outline" className={cn('font-mono text-xs', BADGE_TONES.red)}>{formatAbsoluteTime(request.failedAt)}</Badge></div>}
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
  const supportsAudio = MODEL_REGISTRY[request.videoModel as VideoModel]?.capabilities.audio;
  const loraName = useMemo(
    () => parseLoraPresetName(request.loraPresetData),
    [request.loraPresetData]
  );

  return (
    <>
      <div className="hidden md:flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="font-mono text-xs">
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
          {request.generationMode === 'END_ONLY' && (
            <ImageDown className="h-4 w-4 text-muted-foreground" />
          )}
          {request.generationMode === 'LOOP' && (
            <Repeat className="h-4 w-4 text-muted-foreground" />
          )}
          {request.generationMode === 'REFERENCE' && (
            <Layers className="h-4 w-4 text-muted-foreground" />
          )}
          {supportsAudio && (
            request.audioFile ? (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground/40" />
            )
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap" title={request.prompt}>
            {request.prompt}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="font-mono text-xs text-muted-foreground min-w-16">
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
              loraName={loraName}
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
        <Badge className={`font-mono text-xs ${getStatusBadgeColor(request.status)}`}>
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
            loraName={loraName}
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
