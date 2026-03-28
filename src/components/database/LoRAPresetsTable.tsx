'use client';

import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SortableHeader, formatDate } from './db-utils';
import type { SortState } from '@/hooks/useDatabaseTable';

interface LoRAPresetsTableProps {
  data: Record<string, unknown>[];
  sort: SortState;
  expandedItems: Set<string>;
  onSort: (field: string) => void;
  onToggleExpand: (itemId: string) => void;
}

export function LoRAPresetsTable({ data, sort, expandedItems, onSort, onToggleExpand }: LoRAPresetsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
      <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <SortableHeader field="name" sort={sort} onSort={onSort}>프리셋 이름</SortableHeader>
        </div>
        <div className="col-span-2">소유자</div>
        <div className="col-span-2">
          <SortableHeader field="isDefault" sort={sort} onSort={onSort}>속성</SortableHeader>
        </div>
        <div className="col-span-2">아이템 개수</div>
        <div className="col-span-3">
          <SortableHeader field="createdAt" sort={sort} onSort={onSort}>생성일</SortableHeader>
        </div>
      </div>

      <div className="divide-y">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic DB viewer renders arbitrary Prisma rows */}
        {data.map((preset: any, index: number) => {
          const itemId = `preset-${index}`;
          const isExpanded = expandedItems.has(itemId);

          return (
            <div key={index}>
              <div
                className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                onClick={() => onToggleExpand(itemId)}
              >
                <div className="col-span-3 font-medium">{preset.name}</div>
                <div className="col-span-2 text-muted-foreground">{preset.user?.nickname}</div>
                <div className="col-span-2 flex space-x-1">
                  {preset.isDefault && (
                    <Badge variant="default" className="text-xs">기본</Badge>
                  )}
                  {preset.isPublic && (
                    <Badge variant="secondary" className="text-xs">공개</Badge>
                  )}
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className="text-xs">
                    {preset._count?.loraItems || 0}개
                  </Badge>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="text-xs">{formatDate(preset.createdAt)}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </div>
              </div>

              {isExpanded && preset.loraItems && (
                <div className="px-4 py-3 bg-muted/20 border-t">
                  <div className="font-medium text-sm mb-2">LoRA 아이템들:</div>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- nested LoRA items from JSON parse */}
                    {preset.loraItems.map((item: any, itemIndex: number) => {
                      const displayName = item.loraName || item.loraFilename || '알 수 없는 LoRA';

                      return (
                        <div key={itemIndex} className="p-2 bg-background rounded text-xs">
                          <div className="font-medium">{displayName}</div>
                          <div className="text-muted-foreground">
                            강도: {item.strength} | 그룹: <span className={item.group === 'HIGH' ? 'text-blue-600' : 'text-green-600'}>{item.group}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
