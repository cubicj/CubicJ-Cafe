'use client';

import { Card } from '@/components/ui/card';

interface QueueStatsData {
  pending: number;
  processing: number;
  todayCompleted: number;
  total: number;
}

interface QueueStatsProps {
  stats: QueueStatsData | null;
}

export function QueueStats({ stats }: QueueStatsProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-center gap-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          <div className="text-xs text-muted-foreground">대기중</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
          <div className="text-xs text-muted-foreground">처리중</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats?.todayCompleted || 0}</div>
          <div className="text-xs text-muted-foreground">오늘 완료</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{stats?.total || 0}</div>
          <div className="text-xs text-muted-foreground">전체 대기</div>
        </div>
      </div>

      {!stats && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          통계 데이터를 불러오는 중...
        </div>
      )}
    </Card>
  );
}
