'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ruler } from 'lucide-react';
import type { ReferenceSetState } from '../hooks/useReferenceSet';

interface ResolutionSectionProps {
  referenceSet: ReferenceSetState;
}

const ASPECT_PRESETS = [
  { label: '16:9', width: 16, height: 9 },
  { label: '9:16', width: 9, height: 16 },
  { label: '1:1', width: 1, height: 1 },
  { label: '4:3', width: 4, height: 3 },
  { label: '3:4', width: 3, height: 4 },
];

export function ResolutionSection({ referenceSet }: ResolutionSectionProps) {
  const { images, effectiveResolutionMode, aspectWidth, aspectHeight, setResolutionMode, setAspect } = referenceSet;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Ruler className="h-4 w-4" />
        해상도 비율
      </h2>
      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setResolutionMode('first_image')}
            disabled={images.length === 0}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 ${
              effectiveResolutionMode === 'first_image'
                ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/40'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            첫 이미지 비율
          </button>
          <button
            onClick={() => setResolutionMode('custom')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              effectiveResolutionMode === 'custom'
                ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/40'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            커스텀 비율
          </button>
        </div>
        {effectiveResolutionMode === 'custom' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              {ASPECT_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant={aspectWidth === preset.width && aspectHeight === preset.height ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 min-w-0 px-1"
                  onClick={() => setAspect(preset.width, preset.height)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={aspectWidth}
                onChange={(e) => setAspect(Math.max(1, Math.min(100, Number(e.target.value) || 1)), aspectHeight)}
                className="flex-1 min-w-0 text-center"
              />
              <span className="text-sm text-muted-foreground">:</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={aspectHeight}
                onChange={(e) => setAspect(aspectWidth, Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="flex-1 min-w-0 text-center"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
