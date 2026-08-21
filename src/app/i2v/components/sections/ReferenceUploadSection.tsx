'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PromptInput } from '@/components/i2v/prompt-input';
import AudioPresetSelector from '@/components/audio/AudioPresetSelector';
import { Image as ImageIcon, Film, Music, MessageSquare, Plus, X, Ruler } from 'lucide-react';
import {
  REF_AUDIO_MAX,
  REF_IMAGE_MAX,
  REF_VIDEO_MAX,
  type ReferenceSetState,
} from '../hooks/useReferenceSet';

interface ReferenceUploadSectionProps {
  referenceSet: ReferenceSetState;
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

const ASPECT_PRESETS = [
  { label: '16:9', width: 16, height: 9 },
  { label: '9:16', width: 9, height: 16 },
  { label: '1:1', width: 1, height: 1 },
  { label: '4:3', width: 4, height: 3 },
  { label: '3:4', width: 3, height: 4 },
];

export function ReferenceUploadSection({ referenceSet, prompt, onPromptChange }: ReferenceUploadSectionProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const {
    images, imagePreviewUrls, videos, audios, tags,
    effectiveResolutionMode, aspectWidth, aspectHeight,
    addImages, removeImage, addVideo, removeVideo, toggleSoundtrack,
    addAudioFile, addAudioPreset, removeAudio, setResolutionMode, setAspect,
  } = referenceSet;
  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          레퍼런스 이미지 <span className="text-sm text-gray-500 font-normal">(최대 {REF_IMAGE_MAX}장)</span>
        </h2>
        <Card className="p-4 space-y-2">
          {images.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="text-xs shrink-0">{tags.images[index]}</Badge>
              {imagePreviewUrls[index] && (
                <Image
                  src={imagePreviewUrls[index]}
                  alt={file.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              )}
              <span className="text-sm truncate flex-1 min-w-0">{file.name}</span>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeImage(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {images.length < REF_IMAGE_MAX && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => imageInputRef.current?.click()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> 이미지 추가
            </Button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              addImages(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Film className="h-4 w-4" />
          레퍼런스 비디오 <span className="text-sm text-gray-500 font-normal">(최대 {REF_VIDEO_MAX}개)</span>
        </h2>
        <Card className="p-4 space-y-2">
          {videos.map((entry, index) => (
            <div key={`${entry.file.name}-${index}`} className="p-2 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                {tags.videos[index]?.soundtrack && (
                  <Badge variant="outline" className="text-xs shrink-0">{tags.videos[index].soundtrack}</Badge>
                )}
                <Badge variant="outline" className="text-xs shrink-0">{tags.videos[index]?.video}</Badge>
                <span className="text-sm truncate flex-1 min-w-0">{entry.file.name}</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeVideo(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`ref-video-soundtrack-${index}`}
                  checked={entry.includeSoundtrack}
                  onCheckedChange={() => toggleSoundtrack(index)}
                />
                <Label htmlFor={`ref-video-soundtrack-${index}`} className="text-sm">사운드트랙 포함</Label>
              </div>
            </div>
          ))}
          {videos.length < REF_VIDEO_MAX && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => videoInputRef.current?.click()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> 비디오 추가 <span className="text-xs text-muted-foreground ml-1">(최대 64MB)</span>
            </Button>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addVideo(file);
              e.target.value = '';
            }}
          />
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Music className="h-4 w-4" />
          레퍼런스 오디오 <span className="text-sm text-gray-500 font-normal">(최대 {REF_AUDIO_MAX}개)</span>
        </h2>
        <Card className="p-4 space-y-2">
          {audios.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="text-xs shrink-0">{tags.audios[index]}</Badge>
              <span className="text-sm truncate flex-1 min-w-0">
                {entry.file ? entry.file.name : `프리셋: ${entry.presetId}`}
              </span>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeAudio(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {audios.length < REF_AUDIO_MAX && (
            <>
              <Button variant="outline" size="sm" className="w-full" onClick={() => audioInputRef.current?.click()}>
                <Plus className="h-3.5 w-3.5 mr-1" /> 오디오 파일 추가
              </Button>
              <AudioPresetSelector selectedPresetId={null} onPresetChange={(id) => { if (id) addAudioPreset(id); }} />
            </>
          )}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/wav,audio/mpeg,audio/flac,audio/ogg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addAudioFile(file);
              e.target.value = '';
            }}
          />
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
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
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              첫 이미지 비율
            </button>
            <button
              onClick={() => setResolutionMode('custom')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                effectiveResolutionMode === 'custom'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              커스텀 비율
            </button>
          </div>
          {effectiveResolutionMode === 'custom' && (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {ASPECT_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant={aspectWidth === preset.width && aspectHeight === preset.height ? 'default' : 'outline'}
                    size="sm"
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
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">:</span>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={aspectHeight}
                  onChange={(e) => setAspect(aspectWidth, Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  className="w-20"
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          동작 프롬프트
        </h2>
        <PromptInput value={prompt} onChange={onPromptChange} maxLength={5000} />
      </div>
    </div>
  );
}
