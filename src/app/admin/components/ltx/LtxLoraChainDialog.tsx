'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingEntry {
  value: string;
  type: string;
}

interface NodeOptionsResponse {
  options: Record<string, string[]>;
}

interface LtxLoraChainItem {
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
  key: keyof Pick<LtxLoraChainItem, 'strength' | 'video' | 'videoToAudio' | 'audio' | 'audioToVideo' | 'other'>;
  label: string;
}[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'video', label: 'Video' },
  { key: 'videoToAudio', label: 'Video To Audio' },
  { key: 'audio', label: 'Audio' },
  { key: 'audioToVideo', label: 'Audio To Video' },
  { key: 'other', label: 'Other' },
];

function createEmptyItem(): LtxLoraChainItem {
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

function parseChain(raw: string | undefined): LtxLoraChainItem[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `ltx-lora-${index}`,
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
  items: LtxLoraChainItem[],
  index: number,
  update: Partial<LtxLoraChainItem>
): LtxLoraChainItem[] {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item);
}

export default function LtxLoraChainDialog() {
  const datalistId = useId();
  const [sfw, setSfw] = useState<LtxLoraChainItem[]>([]);
  const [nsfw, setNsfw] = useState<LtxLoraChainItem[]>([]);
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
            '/api/admin/comfyui/node-options?q=ltx_lora_chain_name:LTX2LoraLoaderAdvanced:lora_name:LTX/'
          ),
        ]);

        const ltxSettings = settingsData.ltx ?? {};
        setSfw(parseChain(ltxSettings['ltx.sfw_lora_chain']?.value));
        setNsfw(parseChain(ltxSettings['ltx.nsfw_lora_chain']?.value));
        setLoras(loraData.options.ltx_lora_chain_name ?? []);
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
          { key: 'ltx.sfw_lora_chain', value: JSON.stringify(sfw), type: 'string', category: 'ltx' },
          { key: 'ltx.nsfw_lora_chain', value: JSON.stringify(nsfw), type: 'string', category: 'ltx' },
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

      <datalist id={datalistId}>
        {sortedLoras.map((lora) => (
          <option key={lora} value={lora} />
        ))}
      </datalist>

      <Tabs defaultValue="sfw">
        <TabsList>
          <TabsTrigger value="sfw">SFW</TabsTrigger>
          <TabsTrigger value="nsfw">NSFW</TabsTrigger>
        </TabsList>
        <TabsContent value="sfw">
          <ChainEditor items={sfw} loraListId={datalistId} onChange={setSfw} />
        </TabsContent>
        <TabsContent value="nsfw">
          <ChainEditor items={nsfw} loraListId={datalistId} onChange={setNsfw} />
        </TabsContent>
      </Tabs>

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
  loraListId,
  onChange,
}: {
  items: LtxLoraChainItem[];
  loraListId: string;
  onChange: (items: LtxLoraChainItem[]) => void;
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
              <Input
                value={item.name}
                list={loraListId}
                onChange={(event) => onChange(updateItem(items, index, { name: event.target.value }))}
                className="font-mono text-xs"
              />
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
