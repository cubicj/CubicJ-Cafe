'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface SettingEntry {
  value: string;
  type: string;
}

interface NodeOptionsResponse {
  options: Record<string, string[]>;
}

interface LtxrLoraChainItem {
  id: string;
  enabled: boolean;
  name: string;
  strength: number;
  video: number;
  videoToAudio: number;
  audio: number;
  audioToVideo: number;
  other: number;
}

const DEFAULT_LORA_NAME = 'CONFIGURE_IN_ADMIN';

const NUMBER_FIELDS: {
  key: keyof Pick<LtxrLoraChainItem, 'strength' | 'video' | 'videoToAudio' | 'audio' | 'audioToVideo' | 'other'>;
  label: string;
}[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'video', label: 'Video' },
  { key: 'videoToAudio', label: 'Video To Audio' },
  { key: 'audio', label: 'Audio' },
  { key: 'audioToVideo', label: 'Audio To Video' },
  { key: 'other', label: 'Other' },
];

function createEmptyItem(): LtxrLoraChainItem {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
    enabled: false,
    name: DEFAULT_LORA_NAME,
    strength: 0,
    video: 0,
    videoToAudio: 0,
    audio: 0,
    audioToVideo: 0,
    other: 0,
  };
}

function parseChain(raw: string | undefined): LtxrLoraChainItem[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `ltxr-lora-${index}`,
      enabled: item.enabled === true,
      name: typeof item.name === 'string' ? item.name : DEFAULT_LORA_NAME,
      strength: toNumber(item.strength),
      video: toNumber(item.video),
      videoToAudio: toNumber(item.videoToAudio),
      audio: toNumber(item.audio),
      audioToVideo: toNumber(item.audioToVideo),
      other: toNumber(item.other),
    }));
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function updateItem(
  items: LtxrLoraChainItem[],
  index: number,
  update: Partial<LtxrLoraChainItem>
): LtxrLoraChainItem[] {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item);
}

function getLoraOptions(currentName: string, loras: string[]): string[] {
  if (!currentName || loras.includes(currentName)) return loras;
  return [currentName, ...loras];
}

export default function LtxrLoraChainDialog() {
  const [sfw, setSfw] = useState<LtxrLoraChainItem[]>([]);
  const [loras, setLoras] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const [settingsData, loraData] = await Promise.all([
          apiClient.get<Record<string, Record<string, SettingEntry>>>('/api/admin/settings'),
          apiClient.get<NodeOptionsResponse>(
            '/api/admin/comfyui/node-options?q=ltxr_lora_chain_name:LTX2LoraLoaderAdvanced:lora_name:LTX/'
          ),
        ]);

        const settings = settingsData.ltxr ?? {};
        setSfw(parseChain(settings['ltxr.sfw_lora_chain']?.value));
        setLoras(loraData.options.ltxr_lora_chain_name ?? []);
      } catch {
        setMessage({ type: 'error', text: 'LoRA 체인을 불러오지 못했습니다.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sortedLoras = useMemo(() => [...loras].sort((a, b) => a.localeCompare(b)), [loras]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.put('/api/admin/settings', {
        settings: [
          { key: 'ltxr.sfw_lora_chain', value: JSON.stringify(sfw), type: 'string', category: 'ltxr' },
        ],
      });
      setMessage({ type: 'success', text: 'LoRA 체인이 저장되었습니다.' });
    } catch {
      setMessage({ type: 'error', text: 'LoRA 체인 저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">LoRA 체인 불러오는 중...</p>;
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <ChainEditor items={sfw} loras={sortedLoras} onChange={setSfw} />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  );
}

function ChainEditor({
  items,
  loras,
  onChange,
}: {
  items: LtxrLoraChainItem[];
  loras: string[];
  onChange: (items: LtxrLoraChainItem[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 LoRA가 없습니다.</p>
      ) : (
        items.map((item, index) => (
          <div key={item.id} className="rounded-md border p-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(checked) => onChange(updateItem(items, index, { enabled: checked }))}
                />
                <Label>사용</Label>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">#{index + 1}</div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1">
              <Label>LoRA 이름</Label>
              {loras.length > 0 ? (
                <Select
                  value={item.name || undefined}
                  onValueChange={(name) => onChange(updateItem(items, index, { name }))}
                >
                  <SelectTrigger className="w-full font-mono text-xs">
                    <SelectValue placeholder="LoRA 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLoraOptions(item.name, loras).map((lora) => (
                      <SelectItem key={lora} value={lora} className="font-mono text-xs">
                        {lora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={item.name}
                  onChange={(event) => onChange(updateItem(items, index, { name: event.target.value }))}
                  placeholder="새로고침으로 목록 불러오기"
                  className="font-mono text-xs"
                />
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {NUMBER_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label>{field.label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={String(item[field.key])}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      onChange(updateItem(items, index, { [field.key]: Number.isFinite(value) ? value : 0 }));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, createEmptyItem()])}>
        <Plus className="h-4 w-4 mr-1" />
        LoRA 추가
      </Button>
    </div>
  );
}
