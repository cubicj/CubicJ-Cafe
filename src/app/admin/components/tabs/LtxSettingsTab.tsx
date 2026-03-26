'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

interface SettingEntry {
  value: string;
  type: string;
}

interface SettingsResponse {
  ltx?: Record<string, SettingEntry>;
}

interface SamplersResponse {
  samplers: string[];
}

interface ModelsResponse {
  models: Record<string, string[]>;
}

interface NodeOptionsResponse {
  options: Record<string, string[]>;
}

type ModelCategory = 'diffusionModels' | 'ggufClips' | 'clipEmbeddings' | 'kjVaes';

const LTX_FIELDS = [
  { key: 'ltx.unet', label: 'UNet 모델', type: 'model' as const, group: '모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx.weight_dtype', label: 'Weight Dtype', type: 'string' as const, group: '모델' },
  { key: 'ltx.clip_gguf', label: 'CLIP GGUF 모델', type: 'model' as const, group: '모델', modelCategory: 'ggufClips' as ModelCategory },
  { key: 'ltx.clip_embeddings', label: 'CLIP Embeddings 모델', type: 'model' as const, group: '모델', modelCategory: 'clipEmbeddings' as ModelCategory },
  { key: 'ltx.audio_vae', label: 'Audio VAE 모델', type: 'model' as const, group: '모델', modelCategory: 'kjVaes' as ModelCategory },
  { key: 'ltx.video_vae', label: 'Video VAE 모델', type: 'model' as const, group: '모델', modelCategory: 'kjVaes' as ModelCategory },
  { key: 'ltx.lora_enabled', label: 'LoRA 프리셋 활성화', type: 'boolean' as const, group: '생성' },
  { key: 'ltx.sampler', label: '샘플러', type: 'sampler' as const, group: '생성' },
  { key: 'ltx.nag_scale', label: 'NAG Scale', type: 'number' as const, step: 0.1, group: '생성' },
  { key: 'ltx.nag_alpha', label: 'NAG Alpha', type: 'number' as const, step: 0.01, group: '생성' },
  { key: 'ltx.nag_tau', label: 'NAG Tau', type: 'number' as const, step: 0.1, group: '생성' },
  { key: 'ltx.duration', label: '비디오 길이 (초)', type: 'number' as const, step: 1, group: '생성' },
  { key: 'ltx.frame_rate', label: 'Frame Rate', type: 'number' as const, step: 1, group: '생성' },
  { key: 'ltx.megapixels', label: '이미지 해상도 (MP)', type: 'number' as const, step: 0.01, group: '생성' },
  { key: 'ltx.resize_multiple_of', label: 'Resize Multiple Of', type: 'number' as const, step: 1, group: '생성' },
  { key: 'ltx.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption' as const, group: '생성', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },
  { key: 'ltx.sigmas', label: 'Sigmas', type: 'string' as const, group: 'Sigma' },
  { key: 'ltx.audio_norm', label: 'Audio Normalization', type: 'string' as const, group: 'Audio' },
  { key: 'ltx.rtx_resize_type', label: 'RTX Resize Type', type: 'nodeOption' as const, group: 'RTX', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltx.rtx_scale', label: 'RTX Scale', type: 'number' as const, step: 0.1, group: 'RTX' },
  { key: 'ltx.rtx_quality', label: 'RTX Quality', type: 'nodeOption' as const, group: 'RTX', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },
  { key: 'ltx.negative_prompt', label: '네거티브 프롬프트', type: 'textarea' as const, group: '프롬프트' },
];

let dropdownCache: { samplers: string[]; models: Record<string, string[]>; nodeOptions: Record<string, string[]> } | null = null;

export default function LtxSettingsTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [samplers, setSamplers] = useState<string[]>(dropdownCache?.samplers ?? []);
  const [models, setModels] = useState<Record<string, string[]>>(dropdownCache?.models ?? {});
  const [nodeOptions, setNodeOptions] = useState<Record<string, string[]>>(dropdownCache?.nodeOptions ?? {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAllDropdowns = async () => {
    setRefreshing(true);
    try {
      const nodeQueries = LTX_FIELDS
        .filter((f): f is typeof f & { nodeQuery: string } => f.type === 'nodeOption' && 'nodeQuery' in f)
        .map((f) => f.nodeQuery);

      const [samplerData, modelData, nodeData] = await Promise.all([
        apiClient.get<SamplersResponse>('/api/admin/comfyui/samplers'),
        apiClient.get<ModelsResponse>('/api/admin/comfyui/models'),
        apiClient.get<NodeOptionsResponse>(
          `/api/admin/comfyui/node-options?q=${encodeURIComponent(nodeQueries.join(','))}`
        ),
      ]);

      dropdownCache = { samplers: samplerData.samplers, models: modelData.models, nodeOptions: nodeData.options };
      setSamplers(samplerData.samplers);
      setModels(modelData.models);
      setNodeOptions(nodeData.options);
    } catch {
      setSamplers([]);
      setModels({});
      setNodeOptions({});
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.get<SettingsResponse>('/api/admin/settings');
        const ltx = data.ltx ?? {};
        const initial: Record<string, string> = {};
        for (const field of LTX_FIELDS) {
          initial[field.key] = ltx[field.key]?.value ?? '';
        }
        setValues(initial);
      } catch {
        setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const settings = LTX_FIELDS.map((field) => ({
        key: field.key,
        value: String(values[field.key] ?? ''),
        type: field.type === 'sampler' || field.type === 'model' || field.type === 'textarea' || field.type === 'nodeOption' ? 'string' : field.type,
        category: 'ltx',
      }));
      await apiClient.put('/api/admin/settings', { settings });
      setMessage({ type: 'success', text: '저장되었습니다.' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: '저장에 실패했습니다.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const isSaveDisabled =
    saving ||
    LTX_FIELDS.some(
      (field) => field.type !== 'boolean' && (values[field.key] ?? '').trim() === ''
    );

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">설정 불러오는 중...</p>
      </Card>
    );
  }

  const groups = [...new Set(LTX_FIELDS.map((f) => f.group))];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">LTX 2.3 설정</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={fetchAllDropdowns}
          disabled={refreshing}
          title="ComfyUI에서 드롭다운 옵션 불러오기"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {groups.map((group) => (
        <div key={group} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{group}</h4>
          <div className="grid gap-3">
            {LTX_FIELDS.filter((f) => f.group === group).map((field) => {
              if (field.type === 'boolean') {
                return (
                  <div key={field.key} className="flex items-center justify-between">
                    <Label>{field.label}</Label>
                    <Switch
                      checked={values[field.key] === 'true'}
                      onCheckedChange={(checked) => handleChange(field.key, String(checked))}
                    />
                  </div>
                );
              }

              if (field.type === 'model') {
                const options = models[field.modelCategory] ?? [];
                return (
                  <div key={field.key} className="space-y-1">
                    <Label>{field.label}</Label>
                    {options.length > 0 ? (
                      <Select
                        value={values[field.key] || undefined}
                        onValueChange={(v) => handleChange(field.key, v)}
                      >
                        <SelectTrigger className="w-full font-mono text-xs">
                          <SelectValue placeholder="모델 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((m) => (
                            <SelectItem key={m} value={m} className="font-mono text-xs">
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="text"
                        value={values[field.key] ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder="새로고침으로 목록 불러오기"
                        className="font-mono text-xs"
                      />
                    )}
                  </div>
                );
              }

              if (field.type === 'sampler') {
                return (
                  <div key={field.key} className="space-y-1">
                    <Label>{field.label}</Label>
                    {samplers.length > 0 ? (
                      <Select
                        value={values[field.key] || undefined}
                        onValueChange={(v) => handleChange(field.key, v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="샘플러 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {samplers.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={values[field.key] ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder="새로고침으로 목록 불러오기"
                      />
                    )}
                  </div>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.key} className="space-y-1">
                    <Label>{field.label}</Label>
                    <Textarea
                      value={values[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      rows={3}
                    />
                  </div>
                );
              }

              if (field.type === 'nodeOption') {
                const optionId = field.nodeQuery.split(':')[0];
                const options = nodeOptions[optionId] ?? [];
                return (
                  <div key={field.key} className="space-y-1">
                    <Label>{field.label}</Label>
                    {options.length > 0 ? (
                      <Select
                        value={values[field.key] || undefined}
                        onValueChange={(v) => handleChange(field.key, v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="text"
                        value={values[field.key] ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder="새로고침으로 목록 불러오기"
                      />
                    )}
                  </div>
                );
              }

              if (field.type === 'string') {
                return (
                  <div key={field.key} className="space-y-1">
                    <Label>{field.label}</Label>
                    <Input
                      type="text"
                      value={values[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  </div>
                );
              }

              return (
                <div key={field.key} className="space-y-1">
                  <Label>{field.label}</Label>
                  <Input
                    type="number"
                    step={field.step}
                    value={values[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Button onClick={handleSave} disabled={isSaveDisabled}>
        저장
      </Button>
    </Card>
  );
}
