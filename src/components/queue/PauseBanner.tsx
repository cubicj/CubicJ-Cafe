'use client';

import { Button } from '@/components/ui/button';
import { Wrench, Trash2 } from 'lucide-react';

interface PauseBannerProps {
  position: number | null;
  isInline?: boolean;
  canManage: boolean;
  removing: boolean;
  onRemove: () => void;
}

export function PauseBanner({ position, isInline, canManage, removing, onRemove }: PauseBannerProps) {
  return (
    <div className={`flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 ${isInline ? '' : 'mb-3'}`}>
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
        <Wrench className="h-4 w-4" />
        {isInline
          ? `#${position} 이후 패치 예정 — 큐 일시정지 예약됨`
          : '큐 일시정지 활성 — 패치 진행 중'
        }
      </div>
      {canManage && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          disabled={removing}
          className="text-amber-600 border-amber-300 hover:bg-amber-100"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          해제
        </Button>
      )}
    </div>
  );
}
