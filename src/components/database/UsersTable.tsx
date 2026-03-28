'use client';

import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SortableHeader, formatDate } from './db-utils';
import type { SortState } from '@/hooks/useDatabaseTable';

interface UsersTableProps {
  data: Record<string, unknown>[];
  sort: SortState;
  expandedItems: Set<string>;
  onSort: (field: string) => void;
  onToggleExpand: (itemId: string) => void;
}

export function UsersTable({ data, sort, expandedItems, onSort, onToggleExpand }: UsersTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
      <div className="bg-muted px-4 py-3 border-b font-medium text-sm grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <SortableHeader field="nickname" sort={sort} onSort={onSort}>닉네임</SortableHeader>
        </div>
        <div className="col-span-3">
          <SortableHeader field="discordUsername" sort={sort} onSort={onSort}>Discord 사용자명</SortableHeader>
        </div>
        <div className="col-span-2">
          <SortableHeader field="createdAt" sort={sort} onSort={onSort}>가입일</SortableHeader>
        </div>
        <div className="col-span-2">
          <SortableHeader field="lastLoginAt" sort={sort} onSort={onSort}>최근 로그인</SortableHeader>
        </div>
        <div className="col-span-2">큐/프리셋</div>
      </div>

      <div className="divide-y">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic DB viewer renders arbitrary Prisma rows */}
        {data.map((user: any, index: number) => {
          const itemId = `user-${index}`;
          const isExpanded = expandedItems.has(itemId);

          return (
            <div key={index}>
              <div
                className="px-4 py-3 hover:bg-muted/50 cursor-pointer grid grid-cols-12 gap-4 items-center text-sm"
                onClick={() => onToggleExpand(itemId)}
              >
                <div className="col-span-3 font-medium">{user.nickname}</div>
                <div className="col-span-3 text-muted-foreground">{user.discordUsername}</div>
                <div className="col-span-2 text-xs">{formatDate(user.createdAt)}</div>
                <div className="col-span-2 text-xs">{formatDate(user.lastLoginAt)}</div>
                <div className="col-span-2 flex space-x-1">
                  {user._count && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        큐 {user._count.queueRequests}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        프리셋 {user._count.loraPresets}
                      </Badge>
                    </>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 py-3 bg-muted/20 border-t text-xs space-y-2">
                  <div>
                    <span className="font-medium">Discord ID:</span>
                    <span className="ml-2 font-mono">{user.discordId}</span>
                  </div>
                  <div>
                    <span className="font-medium">수정일:</span>
                    <span className="ml-2">{formatDate(user.updatedAt)}</span>
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
