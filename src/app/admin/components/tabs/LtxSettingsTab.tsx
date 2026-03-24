'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SettingEntry {
  value: string;
  type: string;
}

interface SettingsResponse {
  ltx?: Record<string, SettingEntry>;
}

const LTX_FIELDS = [
  { key: 'ltx.lora_enabled', label: 'LoRA 프리셋 활성화', type: 'boolean' },
  { key: 'ltx.cfg', label: 'CFG Scale', type: 'number', step: 0.1 },
  { key: 'ltx.steps', label: '1패스 스텝 수', type: 'number', step: 1 },
  { key: 'ltx.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1 },
  { key: 'ltx.duration', label: '비디오 길이 (초)', type: 'number', step: 1 },
  { key: 'ltx.megapixels', label: '이미지 해상도 (MP)', type: 'number', step: 0.01 },
  { key: 'ltx.img_compression', label: '이미지 압축', type: 'number', step: 1 },
  { key: 'ltx.negative_prompt', label: '네거티브 프롬프트', type: 'string' },
] as const;

export default function LtxSettingsTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        type: field.type,
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

      <Button onClick={handleSave} disabled={isSaveDisabled}>
        저장
      </Button>
    </Card>
  );
}
