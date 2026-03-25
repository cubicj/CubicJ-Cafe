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

const SAMPLER_KEYS = ['ltx.sampler_1st_pass', 'ltx.sampler_2nd_pass'] as const;

const LTX_FIELDS = [
  { key: 'ltx.lora_enabled', label: 'LoRA 프리셋 활성화', type: 'boolean' },
  { key: 'ltx.cfg', label: 'CFG Scale', type: 'number', step: 0.1 },
  { key: 'ltx.sampler_1st_pass', label: '1st Pass 샘플러', type: 'sampler' },
  { key: 'ltx.sampler_2nd_pass', label: '2nd Pass 샘플러', type: 'sampler' },
  { key: 'ltx.sigmas_1st_pass', label: '1st Pass Sigmas', type: 'string' },
  { key: 'ltx.sigmas_2nd_pass', label: '2nd Pass Sigmas', type: 'string' },
  { key: 'ltx.audio_norm_1st_pass', label: '1st Pass Audio Norm', type: 'string' },
  { key: 'ltx.audio_norm_2nd_pass', label: '2nd Pass Audio Norm', type: 'string' },
  { key: 'ltx.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1 },
  { key: 'ltx.duration', label: '비디오 길이 (초)', type: 'number', step: 1 },
  { key: 'ltx.megapixels', label: '이미지 해상도 (MP)', type: 'number', step: 0.01 },
  { key: 'ltx.img_compression', label: '이미지 압축', type: 'number', step: 1 },
  { key: 'ltx.negative_prompt', label: '네거티브 프롬프트', type: 'string' },
] as const;

let samplerCache: string[] | null = null;

export default function LtxSettingsTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [samplers, setSamplers] = useState<string[]>(samplerCache ?? []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [samplerLoading, setSamplerLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSamplers = async () => {
    setSamplerLoading(true);
    try {
      const data = await apiClient.get<SamplersResponse>('/api/admin/comfyui/samplers');
      samplerCache = data.samplers;
      setSamplers(data.samplers);
    } catch {
      setSamplers([]);
    } finally {
      setSamplerLoading(false);
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
        type: field.type === 'sampler' ? 'string' : field.type,
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

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">LTX 2.3 설정</h3>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {LTX_FIELDS.map((field) => {
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

          if (field.key === 'ltx.negative_prompt') {
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

          if (field.type === 'sampler') {
            return (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>{field.label}</Label>
                  {field.key === SAMPLER_KEYS[0] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={fetchSamplers}
                      disabled={samplerLoading}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${samplerLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
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
                    type="text"
                    value={values[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder="새로고침 버튼을 눌러 목록을 불러오세요"
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
                  placeholder="0.85, 0.725, 0.4219, 0.0"
                />
              </div>
            );
          }

          return (
            <div key={field.key} className="space-y-1">
              <Label>{field.label}</Label>
              <Input
                type="number"
                step={'step' in field ? field.step : undefined}
                value={values[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={isSaveDisabled}>
        저장
      </Button>
    </Card>
  );
}
