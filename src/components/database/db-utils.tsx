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
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}


function getSortIcon(field: string, sort: SortState) {
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

type DisplayValue = string | number;

interface ParsedLoRAPreset {
  presetName: DisplayValue | null;
  loraItems: Array<{
    displayName: DisplayValue;
    strength: DisplayValue | null;
    group: DisplayValue | null;
  }>;
}

function parseDisplayValue(value: unknown): DisplayValue | null {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value == null || value === false) return null;
  throw new Error('Invalid display value');
}

function parseLoRAPresetData(loraPresetData: string): ParsedLoRAPreset | null {
  try {
    const parsed: unknown = JSON.parse(loraPresetData);
    if (!parsed || typeof parsed !== 'object') return null;

    const data = parsed as Record<string, unknown>;
    const rawItems = data.loraItems;
    if (rawItems != null && !Array.isArray(rawItems)) return null;

    const loraItems = (rawItems ?? []).map((rawItem) => {
      if (!rawItem || typeof rawItem !== 'object') throw new Error('Invalid LoRA item');
      const item = rawItem as Record<string, unknown>;
      const displayName = parseDisplayValue(item.loraName)
        ?? parseDisplayValue(item.loraFilename)
        ?? '알 수 없는 LoRA';

      return {
        displayName,
        strength: parseDisplayValue(item.strength),
        group: parseDisplayValue(item.group),
      };
    });

    return {
      presetName: parseDisplayValue(data.presetName),
      loraItems,
    };
  } catch {
    return null;
  }
}

export function LoRAPresetDisplay({ loraPresetData, videoModel }: { loraPresetData: string; videoModel?: string }) {
  const presetData = parseLoRAPresetData(loraPresetData);
  if (!presetData) {
    return (
      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
        {loraPresetData}
      </pre>
    );
  }

  const showGroup = videoModel !== 'ltx' && videoModel !== 'ltxa';
  return (
    <div className="mt-1 p-2 bg-background rounded">
      {presetData.presetName && (
        <div className="font-medium text-xs mb-2">{presetData.presetName}</div>
      )}
      {presetData.loraItems.length > 0 && (
        <div className="space-y-1">
          {presetData.loraItems.map((item, index) => (
            <div key={index} className="text-xs p-1 bg-muted rounded border">
              <div className="font-medium">{item.displayName}</div>
              <div className="text-muted-foreground">
                강도: {item.strength}{showGroup && (<> | 그룹: <span className={item.group === 'HIGH' ? 'text-blue-600' : 'text-green-600'}>{item.group}</span></>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
