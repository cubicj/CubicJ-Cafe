'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { SortableHeader, formatDate, LoRAPresetDisplay } from './db-utils';
import { getStatusBgColor } from '@/lib/queue-status';
import type { SortState } from '@/hooks/useDatabaseTable';

interface QueueTableProps {
  data: Record<string, unknown>[];
  sort: SortState;
  expandedItems: Set<string>;
  onSort: (field: string) => void;
  onToggleExpand: (itemId: string) => void;
}

export function QueueTable({ data, sort, expandedItems, onSort, onToggleExpand }: QueueTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-175">
      <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <SortableHeader field="nickname" sort={sort} onSort={onSort}>닉네임</SortableHeader>
        </div>
        <div className="col-span-2">
          <SortableHeader field="status" sort={sort} onSort={onSort}>상태</SortableHeader>
        </div>
        <div className="col-span-1">
          <SortableHeader field="position" sort={sort} onSort={onSort}>위치</SortableHeader>
        </div>
        <div className="col-span-3">NSFW/기타</div>
        <div className="col-span-3">작업 정보</div>
      </div>

      <div className="divide-y">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic DB viewer renders arbitrary Prisma rows */}
        {data.map((request: any, index: number) => {
          const itemId = `queue-${index}`;
          const isExpanded = expandedItems.has(itemId);

          return (
            <div key={index}>
              <div
                className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                onClick={() => onToggleExpand(itemId)}
              >
                <div className="col-span-3 font-medium">{request.nickname}</div>
                <div className="col-span-2">
                  <Badge className={`text-xs ${getStatusBgColor(request.status)}`}>
                    {request.status}
                  </Badge>
                </div>
                <div className="col-span-1">#{request.position}</div>
                <div className="col-span-3 flex items-center gap-1">
                  {request.videoModel && (
                    <Badge variant="outline" className="text-xs">{request.videoModel === 'wan' ? 'WAN' : 'LTX'}</Badge>
                  )}
                  {request.videoDuration && (
                    <Badge variant="outline" className="text-xs">{request.videoDuration}초</Badge>
                  )}
                  {request.isNSFW && (
                    <Badge variant="destructive" className="text-xs">NSFW</Badge>
                  )}
                </div>
                <div className="col-span-3 flex items-center">
                  {request.generationMode && (
                    <Badge variant="outline" className="text-xs">
                      {request.generationMode === 'LOOP' ? '루프' : request.generationMode === 'START_END' ? '처음+끝' : '기본'}{request.audioFile ? '+오디오' : ''}
                    </Badge>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 py-3 bg-muted/20 border-t text-xs space-y-3">
                  <div>
                    <span className="font-medium">프롬프트:</span>
                    <p className="mt-1 p-2 bg-background rounded">{request.prompt}</p>
                  </div>

                  {request.imageFile && (
                    <div>
                      <span className="font-medium">이미지 파일:</span>
                      <span className="ml-2">{request.imageFile}</span>
                    </div>
                  )}

                  {request.audioFile && (
                    <div>
                      <span className="font-medium">오디오 파일:</span>
                      <span className="ml-2">{request.audioFile}</span>
                    </div>
                  )}

                  {request.loraPresetData && (
                    <div>
                      <span className="font-medium">LoRA 프리셋:</span>
                      <LoRAPresetDisplay loraPresetData={request.loraPresetData} videoModel={request.videoModel as string} />
                    </div>
                  )}

                  {request.videoModel && (
                    <div>
                      <span className="font-medium">모델:</span>
                      <span className="ml-2">{request.videoModel === 'wan' ? 'WAN 2.2' : request.videoModel === 'ltx' ? 'LTX 2.3' : request.videoModel}</span>
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
