'use client';

import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SortableHeader, formatDate, getStatusColor, LoRAPresetDisplay } from './db-utils';
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
      <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
        <div className="col-span-2">
          <SortableHeader field="nickname" sort={sort} onSort={onSort}>닉네임</SortableHeader>
        </div>
        <div className="col-span-2">
          <SortableHeader field="status" sort={sort} onSort={onSort}>상태</SortableHeader>
        </div>
        <div className="col-span-1">
          <SortableHeader field="position" sort={sort} onSort={onSort}>위치</SortableHeader>
        </div>
        <div className="col-span-3">
          <SortableHeader field="createdAt" sort={sort} onSort={onSort}>생성일</SortableHeader>
        </div>
        <div className="col-span-2">NSFW/기타</div>
        <div className="col-span-2">작업 정보</div>
      </div>

      <div className="divide-y">
        {data.map((request: any, index: number) => {
          const itemId = `queue-${index}`;
          const isExpanded = expandedItems.has(itemId);

          return (
            <div key={index}>
              <div
                className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                onClick={() => onToggleExpand(itemId)}
              >
                <div className="col-span-2 font-medium">{request.nickname}</div>
                <div className="col-span-2">
                  <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                    {request.status}
                  </Badge>
                </div>
                <div className="col-span-1">#{request.position}</div>
                <div className="col-span-3 text-xs">{formatDate(request.createdAt)}</div>
                <div className="col-span-2">
                  {request.isNSFW && (
                    <Badge variant="destructive" className="text-xs">NSFW</Badge>
                  )}
                </div>
                <div className="col-span-2 flex items-center">
                  {request.jobId && (
                    <Badge variant="outline" className="text-xs">작업중</Badge>
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

                  {request.loraPresetData && (
                    <div>
                      <span className="font-medium">LoRA 프리셋:</span>
                      <LoRAPresetDisplay loraPresetData={request.loraPresetData} />
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
