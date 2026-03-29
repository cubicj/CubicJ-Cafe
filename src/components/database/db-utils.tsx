import { Database, Users, Video, Settings, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortState } from '@/hooks/useDatabaseTable';

export function getTableIcon(tableName: string) {
  switch (tableName) {
    case 'users':
      return <Users className="w-4 h-4" />;
    case 'queue_requests':
      return <Video className="w-4 h-4" />;
    case 'lora_presets':
      return <Settings className="w-4 h-4" />;
    default:
      return <Database className="w-4 h-4" />;
  }
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}


export function getSortIcon(field: string, sort: SortState) {
  if (sort.orderBy !== field) {
    return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
  }
  return sort.orderDirection === 'desc'
    ? <ArrowDown className="w-3 h-3" />
    : <ArrowUp className="w-3 h-3" />;
}

interface SortableHeaderProps {
  field: string;
  sort: SortState;
  onSort: (field: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortableHeader({ field, sort, onSort, children, className = "" }: SortableHeaderProps) {
  return (
    <div
      className={`flex items-center space-x-1 cursor-pointer hover:text-foreground ${className}`}
      onClick={() => onSort(field)}
    >
      <span>{children}</span>
      {getSortIcon(field, sort)}
    </div>
  );
}

export function LoRAPresetDisplay({ loraPresetData, videoModel }: { loraPresetData: string; videoModel?: string }) {
  try {
    const presetData = JSON.parse(loraPresetData);
    const showGroup = videoModel !== 'ltx';
    return (
      <div className="mt-1 p-2 bg-background rounded">
        {presetData.presetName && (
          <div className="font-medium text-xs mb-2">{presetData.presetName}</div>
        )}
        {presetData.loraItems && presetData.loraItems.length > 0 && (
          <div className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- loraItems from JSON.parse of stored preset data */}
            {presetData.loraItems.map((item: any, index: number) => {
              const displayName = item.loraName || item.loraFilename || '알 수 없는 LoRA';
              return (
                <div key={index} className="text-xs p-1 bg-muted rounded border">
                  <div className="font-medium">{displayName}</div>
                  <div className="text-muted-foreground">
                    강도: {item.strength}{showGroup && (<> | 그룹: <span className={item.group === 'HIGH' ? 'text-blue-600' : 'text-green-600'}>{item.group}</span></>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
        {loraPresetData}
      </pre>
    );
  }
}
