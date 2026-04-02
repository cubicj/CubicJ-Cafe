'use client';

import { useState, useEffect, type ReactNode } from 'react';
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

interface SamplersResponse {
  samplers: string[];
}

interface ModelsResponse {
  models: Record<string, string[]>;
}

interface NodeOptionsResponse {
  options: Record<string, string[]>;
}

export interface SettingsField {
  key: string;
  label: string;
  type: 'model' | 'sampler' | 'boolean' | 'number' | 'string' | 'textarea' | 'nodeOption' | 'select';
  group: string;
  modelCategory?: string;
  nodeQuery?: string;
  step?: number;
  textareaRows?: number;
  monoFont?: boolean;
  options?: { label: string; value: string }[];
}

interface ModelSettingsTabProps {
  title: string;
  category: string;
  fields: SettingsField[];
  headerExtra?: ReactNode;
  onValuesLoaded?: (values: Record<string, string>) => void;
  onValueChange?: (key: string, value: string) => void;
}

const dropdownCaches = new Map<string, { samplers: string[]; models: Record<string, string[]>; nodeOptions: Record<string, string[]> }>();

export default function ModelSettingsTab({ title, category, fields, headerExtra, onValuesLoaded, onValueChange }: ModelSettingsTabProps) {
  const cache = dropdownCaches.get(category);
  const [values, setValues] = useState<Record<string, string>>({});
  const [samplers, setSamplers] = useState<string[]>(cache?.samplers ?? []);
  const [models, setModels] = useState<Record<string, string[]>>(cache?.models ?? {});
  const [nodeOptions, setNodeOptions] = useState<Record<string, string[]>>(cache?.nodeOptions ?? {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAllDropdowns = async () => {
    setRefreshing(true);
    try {
      const nodeQueries = fields
        .filter((f): f is typeof f & { nodeQuery: string } => f.type === 'nodeOption' && 'nodeQuery' in f)
        .map((f) => f.nodeQuery);

      const [samplerData, modelData, nodeData] = await Promise.all([
        apiClient.get<SamplersResponse>('/api/admin/comfyui/samplers'),
        apiClient.get<ModelsResponse>('/api/admin/comfyui/models'),
        apiClient.get<NodeOptionsResponse>(
          `/api/admin/comfyui/node-options?q=${encodeURIComponent(nodeQueries.join(','))}`
        ),
      ]);

      const newCache = { samplers: samplerData.samplers, models: modelData.models, nodeOptions: nodeData.options };
      dropdownCaches.set(category, newCache);
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
        const data = await apiClient.get<Record<string, Record<string, SettingEntry>>>('/api/admin/settings');
        const settings = data[category] ?? {};
        const initial: Record<string, string> = {};
        for (const field of fields) {
          initial[field.key] = settings[field.key]?.value ?? '';
        }
        setValues(initial);
        onValuesLoaded?.(initial);
      } catch {
        setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, fields]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    onValueChange?.(key, value);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const settings = fields.map((field) => ({
        key: field.key,
        value: String(values[field.key] ?? ''),
        type: field.type === 'model' || field.type === 'sampler' || field.type === 'textarea' || field.type === 'nodeOption' ? 'string' : field.type,
        category,
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
    fields.some(
      (field) => field.type !== 'boolean' && (values[field.key] ?? '').trim() === ''
    );

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">설정 불러오는 중...</p>
      </Card>
    );
  }

  const groups = [...new Set(fields.map((f) => f.group))];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
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
        <div className="ml-auto">{headerExtra}</div>
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
            {fields.filter((f) => f.group === group).map((field) => (
              <SettingsFieldRenderer
                key={field.key}
                field={field}
                value={values[field.key] ?? ''}
                samplers={samplers}
                models={models}
                nodeOptions={nodeOptions}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      ))}

      <Button onClick={handleSave} disabled={isSaveDisabled}>
        저장
      </Button>
    </Card>
  );
}

function SettingsFieldRenderer({
  field,
  value,
  samplers,
  models,
  nodeOptions,
  onChange,
}: {
  field: SettingsField;
  value: string;
  samplers: string[];
  models: Record<string, string[]>;
  nodeOptions: Record<string, string[]>;
  onChange: (key: string, value: string) => void;
}) {
  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <Label>{field.label}</Label>
        <Switch
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(field.key, String(checked))}
        />
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <Select value={value || undefined} onValueChange={(v) => onChange(field.key, v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === 'model') {
    const options = models[field.modelCategory ?? ''] ?? [];
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        {options.length > 0 ? (
          <Select value={value || undefined} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger className="w-full font-mono text-xs">
              <SelectValue placeholder="모델 선택" />
            </SelectTrigger>
            <SelectContent>
              {options.map((m) => (
                <SelectItem key={m} value={m} className="font-mono text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder="새로고침으로 목록 불러오기"
            className="font-mono text-xs"
          />
        )}
      </div>
    );
  }

  if (field.type === 'sampler') {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        {samplers.length > 0 ? (
          <Select value={value || undefined} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="샘플러 선택" />
            </SelectTrigger>
            <SelectContent>
              {samplers.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder="새로고침으로 목록 불러오기"
          />
        )}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={field.textareaRows ?? 3}
          className={field.monoFont ? 'font-mono text-xs' : ''}
        />
      </div>
    );
  }

  if (field.type === 'nodeOption') {
    const optionId = field.nodeQuery!.split(':')[0];
    const options = nodeOptions[optionId] ?? [];
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        {options.length > 0 ? (
          <Select value={value || undefined} onValueChange={(v) => onChange(field.key, v)}>
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
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder="새로고침으로 목록 불러오기"
          />
        )}
      </div>
    );
  }

  if (field.type === 'string') {
    return (
      <div className="space-y-1">
        <Label>{field.label}</Label>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label>{field.label}</Label>
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </div>
  );
}
