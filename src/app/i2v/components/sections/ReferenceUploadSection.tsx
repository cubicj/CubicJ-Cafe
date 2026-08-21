'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PromptInput } from '@/components/i2v/prompt-input';
import AudioPresetSelector from '@/components/audio/AudioPresetSelector';
import { Image as ImageIcon, Film, Music, MessageSquare, Plus, X } from 'lucide-react';
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

export function ReferenceUploadSection({ referenceSet, prompt, onPromptChange }: ReferenceUploadSectionProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const {
    images, imagePreviewUrls, videos, audios, tags,
    addImages, removeImage, addVideo, removeVideo, toggleSoundtrack,
    addAudioFile, addAudioPreset, removeAudio, removeAudioPreset,
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
                {entry.file ? entry.file.name : `프리셋: ${entry.presetName}`}
              </span>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeAudio(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {audios.length < REF_AUDIO_MAX && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => audioInputRef.current?.click()}>
              <Plus className="h-3.5 w-3.5 mr-1" /> 오디오 파일 추가
            </Button>
          )}
          <AudioPresetSelector
            addedPresetIds={audios.flatMap((entry) => entry.presetId ? [entry.presetId] : [])}
            onAddPreset={addAudioPreset}
            onPresetDeleted={removeAudioPreset}
            addDisabled={audios.length >= REF_AUDIO_MAX}
          />
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
          <MessageSquare className="h-4 w-4" />
          동작 프롬프트
        </h2>
        <PromptInput value={prompt} onChange={onPromptChange} maxLength={5000} />
      </div>
    </div>
  );
}
