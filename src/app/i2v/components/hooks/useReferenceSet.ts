'use client';

import { useCallback, useMemo, useState } from 'react';
import { computeReferenceTags, type ReferenceTags } from '@/lib/comfyui/workflows/h3-ref2va/reference-tags';

export const REF_IMAGE_MAX = 9;
export const REF_VIDEO_MAX = 3;
export const REF_AUDIO_MAX = 3;

export interface ReferenceVideoEntry {
  file: File;
  includeSoundtrack: boolean;
}

export type ReferenceAudioEntry = { file: File; presetId?: undefined } | { presetId: string; file?: undefined };

export type Ref2vaResolutionMode = 'first_image' | 'custom';

export interface ReferenceSetState {
  images: File[];
  videos: ReferenceVideoEntry[];
  audios: ReferenceAudioEntry[];
  tags: ReferenceTags;
  totalCount: number;
  resolutionMode: Ref2vaResolutionMode;
  effectiveResolutionMode: Ref2vaResolutionMode;
  aspectWidth: number;
  aspectHeight: number;
  addImages: (files: File[]) => void;
  removeImage: (index: number) => void;
  addVideo: (file: File) => void;
  removeVideo: (index: number) => void;
  toggleSoundtrack: (index: number) => void;
  addAudioFile: (file: File) => void;
  addAudioPreset: (presetId: string) => void;
  removeAudio: (index: number) => void;
  setResolutionMode: (mode: Ref2vaResolutionMode) => void;
  setAspect: (width: number, height: number) => void;
  reset: () => void;
}

export function useReferenceSet(): ReferenceSetState {
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<ReferenceVideoEntry[]>([]);
  const [audios, setAudios] = useState<ReferenceAudioEntry[]>([]);
  const [resolutionMode, setResolutionMode] = useState<Ref2vaResolutionMode>('first_image');
  const [aspectWidth, setAspectWidth] = useState(16);
  const [aspectHeight, setAspectHeight] = useState(9);

  const addImages = useCallback((files: File[]) => {
    setImages((prev) => [...prev, ...files].slice(0, REF_IMAGE_MAX));
  }, []);
  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const addVideo = useCallback((file: File) => {
    setVideos((prev) => (prev.length >= REF_VIDEO_MAX ? prev : [...prev, { file, includeSoundtrack: false }]));
  }, []);
  const removeVideo = useCallback((index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const toggleSoundtrack = useCallback((index: number) => {
    setVideos((prev) => prev.map((entry, i) => (i === index ? { ...entry, includeSoundtrack: !entry.includeSoundtrack } : entry)));
  }, []);
  const addAudioFile = useCallback((file: File) => {
    setAudios((prev) => (prev.length >= REF_AUDIO_MAX ? prev : [...prev, { file }]));
  }, []);
  const addAudioPreset = useCallback((presetId: string) => {
    setAudios((prev) => (prev.length >= REF_AUDIO_MAX ? prev : [...prev, { presetId }]));
  }, []);
  const removeAudio = useCallback((index: number) => {
    setAudios((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const setAspect = useCallback((width: number, height: number) => {
    setAspectWidth(Math.max(1, Math.min(100, Math.round(width) || 1)));
    setAspectHeight(Math.max(1, Math.min(100, Math.round(height) || 1)));
  }, []);
  const reset = useCallback(() => {
    setImages([]);
    setVideos([]);
    setAudios([]);
    setResolutionMode('first_image');
    setAspectWidth(16);
    setAspectHeight(9);
  }, []);

  const tags = useMemo(
    () => computeReferenceTags({
      imageCount: images.length,
      videos: videos.map((video) => ({ includeSoundtrack: video.includeSoundtrack })),
      audioCount: audios.length,
    }),
    [images.length, videos, audios.length]
  );

  const effectiveResolutionMode: Ref2vaResolutionMode = images.length === 0 ? 'custom' : resolutionMode;

  return {
    images,
    videos,
    audios,
    tags,
    totalCount: images.length + videos.length + audios.length,
    resolutionMode,
    effectiveResolutionMode,
    aspectWidth,
    aspectHeight,
    addImages,
    removeImage,
    addVideo,
    removeVideo,
    toggleSoundtrack,
    addAudioFile,
    addAudioPreset,
    removeAudio,
    setResolutionMode,
    setAspect,
    reset,
  };
}
