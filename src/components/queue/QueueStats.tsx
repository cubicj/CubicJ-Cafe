'use client';

import { Card } from '@/components/ui/card';
import { getStatusAccentColor, getStatusText } from '@/lib/queue-status';

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
      <div className="flex flex-wrap justify-center gap-4 md:gap-8">
        <div className="text-center">
          <div className={`text-xl md:text-2xl font-bold ${getStatusAccentColor('PENDING')}`}>{stats?.pending || 0}</div>
          <div className="text-xs text-muted-foreground">{getStatusText('PENDING')}</div>
        </div>
        <div className="text-center">
          <div className={`text-xl md:text-2xl font-bold ${getStatusAccentColor('PROCESSING')}`}>{stats?.processing || 0}</div>
          <div className="text-xs text-muted-foreground">{getStatusText('PROCESSING')}</div>
        </div>
        <div className="text-center">
          <div className={`text-xl md:text-2xl font-bold ${getStatusAccentColor('COMPLETED')}`}>{stats?.todayCompleted || 0}</div>
          <div className="text-xs text-muted-foreground">오늘 {getStatusText('COMPLETED')}</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-primary">{stats?.total || 0}</div>
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
