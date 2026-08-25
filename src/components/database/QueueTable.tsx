'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { SortableHeader, formatDate, LoRAPresetDisplay } from './db-utils';
import { getStatusBgColor } from '@/lib/queue-status';
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import type { SortState } from '@/hooks/useDatabaseTable';
import type { WorkflowSummary } from '@/lib/comfyui/workflows/workflow-summary';

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(MODEL_REGISTRY).map(([model, config]) => [model, config.displayName])
  ),
  ltx: 'LTX(Anime)',
};

const REFERENCE_KIND_LABELS = {
  IMAGE: '이미지',
  VIDEO: '영상',
  AUDIO: '오디오',
} as const;

function getModelDisplayName(videoModel: string) {
  return MODEL_DISPLAY_NAMES[videoModel] ?? videoModel;
}

interface QueueTableProps {
  data: Record<string, unknown>[];
  sort: SortState;
  expandedItems: Set<string>;
  onSort: (field: string) => void;
  onToggleExpand: (itemId: string) => void;
}

interface QueueRow extends Record<string, unknown> {
  id: string;
  position: number;
  nickname: string;
  status: string;
  prompt: string;
  videoDuration?: number;
  videoDurationSeconds?: number;
  videoModel?: string;
  isNSFW?: boolean;
  generationMode?: string;
  imageFile?: string;
  endImageFile?: string;
  audioFile?: string;
  audioPresetName?: string;
  loraPresetData?: string;
  resolutionMode?: string | null;
  aspectWidth?: number | null;
  aspectHeight?: number | null;
  referenceFiles?: Array<{
    kind: string;
    slot: number;
    filename: string;
    includeSoundtrack: boolean;
    audioPresetName: string | null;
  }>;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  jobId?: string;
  error?: string;
  hasWorkflow?: boolean;
  workflowSummary?: WorkflowSummary | null;
}

export function CollapsiblePrompt({ prompt }: { prompt: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button
      type="button"
      className={`mt-1 p-2 bg-background rounded w-full text-left whitespace-pre-wrap cursor-pointer ${isExpanded ? '' : 'line-clamp-2'}`}
      onClick={() => setIsExpanded((expanded) => !expanded)}
    >
      {prompt}
    </button>
  );
}

function hasWorkflowSummary(
  summary: WorkflowSummary | null | undefined
): summary is WorkflowSummary {
  return !!summary && Object.values(summary).some((values) => values.length > 0);
}

function WorkflowSummaryDetails({ summary }: { summary: WorkflowSummary }) {
  return (
    <div>
      <span className="font-medium">생성 설정:</span>
      <div className="mt-1 ml-2 space-y-1">
        {summary.steps.length > 0 && (
          <div>
            <span className="font-medium">Steps:</span>
            <span className="ml-2">{summary.steps.join(' / ')}</span>
          </div>
        )}
        {summary.megapixels.length > 0 && (
          <div>
            <span className="font-medium">MP:</span>
            <span className="ml-2">{summary.megapixels.join(' / ')}</span>
          </div>
        )}
        {summary.samplers.length > 0 && (
          <div>
            <span className="font-medium">샘플러:</span>
            <span className="ml-2">{summary.samplers.join(' / ')}</span>
          </div>
        )}
        {summary.schedulers.length > 0 && (
          <div>
            <span className="font-medium">스케줄러:</span>
            <span className="ml-2">{summary.schedulers.join(' / ')}</span>
          </div>
        )}
        {summary.models.length > 0 && (
          <div className="flex items-start gap-2 min-w-0">
            <span className="font-medium shrink-0">모델:</span>
            <div className="min-w-0 font-mono break-all">
              {summary.models.map((model) => <div key={model}>{model}</div>)}
            </div>
          </div>
        )}
        {summary.loras.length > 0 && (
          <div className="flex items-start gap-2 min-w-0">
            <span className="font-medium shrink-0">LoRA:</span>
            <div className="min-w-0 font-mono break-all">
              {summary.loras.map((lora) => <div key={lora}>{lora}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getModelConfig(videoModel?: string) {
  if (!videoModel || !Object.hasOwn(MODEL_REGISTRY, videoModel)) return undefined;
  return MODEL_REGISTRY[videoModel as keyof typeof MODEL_REGISTRY];
}

function getReferenceKindLabel(kind: string) {
  return REFERENCE_KIND_LABELS[kind as keyof typeof REFERENCE_KIND_LABELS] ?? kind;
}

function getReferenceComposition(referenceFiles: QueueRow['referenceFiles']) {
  return Object.entries(REFERENCE_KIND_LABELS)
    .map(([kind, label]) => {
      const count = referenceFiles?.filter((file) => file.kind === kind).length ?? 0;
      return count > 0 ? `${label} ${count}` : null;
    })
    .filter((part): part is string => part !== null)
    .join(' · ');
}

function getResolutionLabel(request: QueueRow) {
  if (request.resolutionMode === 'first_image') return '첫 이미지 비율';
  if (request.resolutionMode === 'custom') {
    return `커스텀 ${request.aspectWidth ?? '-'}:${request.aspectHeight ?? '-'}`;
  }
  return request.resolutionMode;
}

export function QueueTable({ data, sort, expandedItems, onSort, onToggleExpand }: QueueTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-175">
      <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
        <div className="col-span-1">
          <SortableHeader field="position" sort={sort} onSort={onSort}>위치</SortableHeader>
        </div>
        <div className="col-span-2">
          <SortableHeader field="nickname" sort={sort} onSort={onSort}>닉네임</SortableHeader>
        </div>
        <div className="col-span-2">
          <SortableHeader field="status" sort={sort} onSort={onSort}>상태</SortableHeader>
        </div>
        <div className="col-span-1">길이</div>
        <div className="col-span-3">모델/NSFW</div>
        <div className="col-span-3">작업 정보</div>
      </div>

      <div className="divide-y">
        {(data as QueueRow[]).map((request, index) => {
          const itemId = `queue-${index}`;
          const isExpanded = expandedItems.has(itemId);
          const modelConfig = getModelConfig(request.videoModel);
          const referenceComposition = modelConfig?.capabilities.referenceInputs
            ? getReferenceComposition(request.referenceFiles)
            : '';

          return (
            <div key={index}>
              <div
                className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                onClick={() => onToggleExpand(itemId)}
              >
                <div className="col-span-1">#{request.position}</div>
                <div className="col-span-2 font-medium truncate">{request.nickname}</div>
                <div className="col-span-2">
                  <Badge className={`text-xs ${getStatusBgColor(request.status)}`}>
                    {request.status}
                  </Badge>
                </div>
                <div className="col-span-1 text-xs">
                  {request.videoDuration && (
                    <div className="space-y-0.5">
                      <div>{request.videoDurationSeconds ? `${request.videoDurationSeconds.toFixed(1)}초` : `${request.videoDuration}초`}</div>
                      {request.videoDurationSeconds && request.videoDurationSeconds !== request.videoDuration && (
                        <div className="text-muted-foreground">N {request.videoDuration}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  {request.videoModel && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">{getModelDisplayName(request.videoModel)}</Badge>
                  )}
                  {request.isNSFW && (
                    <Badge variant="destructive" className="text-xs whitespace-nowrap">NSFW</Badge>
                  )}
                </div>
                <div className="col-span-3 flex items-center flex-wrap gap-1">
                  {request.generationMode && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {request.generationMode === 'LOOP' ? '루프' : request.generationMode === 'START_END' ? '처음+끝' : request.generationMode === 'END_ONLY' ? '끝 이미지' : request.generationMode === 'REFERENCE' ? '레퍼런스' : '기본'}{request.audioFile ? '+오디오' : ''}
                    </Badge>
                  )}
                  {referenceComposition && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {referenceComposition}
                    </Badge>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 py-3 bg-muted/20 border-t text-xs space-y-3">
                  <div>
                    <span className="font-medium">프롬프트:</span>
                    <CollapsiblePrompt prompt={request.prompt} />
                  </div>

                  {hasWorkflowSummary(request.workflowSummary) && (
                    <WorkflowSummaryDetails summary={request.workflowSummary} />
                  )}

                  {modelConfig?.capabilities.endImage ? (
                    <>
                      {request.imageFile && (
                        <div>
                          <span className="font-medium">시작 이미지:</span>
                          <span className="ml-2">{request.imageFile}</span>
                        </div>
                      )}
                      {request.endImageFile && (
                        <div>
                          <span className="font-medium">끝 이미지:</span>
                          <span className="ml-2">{request.endImageFile}</span>
                        </div>
                      )}
                    </>
                  ) : request.imageFile ? (
                    <div>
                      <span className="font-medium">이미지 파일:</span>
                      <span className="ml-2">{request.imageFile}</span>
                    </div>
                  ) : null}

                  {modelConfig?.capabilities.referenceInputs && request.referenceFiles && request.referenceFiles.length > 0 && (
                    <div>
                      <span className="font-medium">레퍼런스:</span>
                      <div className="mt-1 ml-2 space-y-1">
                        {request.referenceFiles.map((file) => (
                          <div key={`${file.kind}-${file.slot}`}>
                            {getReferenceKindLabel(file.kind)} #{file.slot}: {file.filename}
                            {file.includeSoundtrack ? ' (사운드트랙)' : ''}
                            {file.audioPresetName ? ` · ${file.audioPresetName}` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modelConfig && request.resolutionMode && (
                    <div>
                      <span className="font-medium">해상도:</span>
                      <span className="ml-2">{getResolutionLabel(request)}</span>
                    </div>
                  )}

                  {request.audioFile && (
                    <div>
                      <span className="font-medium">오디오:</span>
                      <span className="ml-2">{request.audioPresetName || request.audioFile}</span>
                    </div>
                  )}

                  {request.loraPresetData && (
                    <div>
                      <span className="font-medium">LoRA 프리셋:</span>
                      <LoRAPresetDisplay loraPresetData={request.loraPresetData} videoModel={request.videoModel} />
                    </div>
                  )}

                  {request.videoModel && (
                    <div>
                      <span className="font-medium">모델:</span>
                      <span className="ml-2">{getModelDisplayName(request.videoModel)}</span>
                    </div>
                  )}

                  {request.videoDuration && (
                    <div>
                      <span className="font-medium">영상 길이:</span>
                      <span className="ml-2">
                        {request.videoDurationSeconds ? `${request.videoDurationSeconds.toFixed(1)}초` : `${request.videoDuration}초`}
                        {request.videoDurationSeconds && request.videoDurationSeconds !== request.videoDuration ? ` (N ${request.videoDuration})` : ''}
                      </span>
                    </div>
                  )}

                  {request.createdAt && (
                    <div>
                      <span className="font-medium">생성일:</span>
                      <span className="ml-2">{formatDate(request.createdAt)}</span>
                    </div>
                  )}

                  {request.startedAt && request.completedAt && (
                    <div>
                      <span className="font-medium">처리 시간:</span>
                      <span className="ml-2">{((new Date(request.completedAt).getTime() - new Date(request.startedAt).getTime()) / 1000).toFixed(1)}초</span>
                    </div>
                  )}

                  {request.jobId && (
                    <div>
                      <span className="font-medium">작업 ID:</span>
                      <span className="ml-2 font-mono">{request.jobId}</span>
                    </div>
                  )}

                  {request.error && (
                    <div>
                      <span className="font-medium">오류:</span>
                      <p className="mt-1 p-2 bg-red-50 rounded text-xs text-red-700">{request.error}</p>
                    </div>
                  )}

                  {request.hasWorkflow && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/admin/queue/${request.id}/workflow`, '_blank');
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        워크플로우 JSON
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </div>
      </div>
    </div>
  );
}
