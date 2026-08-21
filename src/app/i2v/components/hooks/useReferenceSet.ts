'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeReferenceTags, type ReferenceTags } from '@/lib/comfyui/workflows/h3-ref2va/reference-tags';

export const REF_IMAGE_MAX = 9;
export const REF_VIDEO_MAX = 3;
export const REF_AUDIO_MAX = 3;

export interface ReferenceVideoEntry {
  file: File;
  includeSoundtrack: boolean;
}

interface ReferenceImageEntry {
  file: File;
  previewUrl: string;
}

export type ReferenceAudioEntry = { file: File; presetId?: undefined; presetName?: undefined } | { presetId: string; presetName: string; file?: undefined };

export type Ref2vaResolutionMode = 'first_image' | 'custom';

export interface ReferenceSetState {
  images: File[];
  imagePreviewUrls: string[];
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
  addAudioPreset: (preset: { id: string; name: string }) => void;
  removeAudioPreset: (presetId: string) => void;
  removeAudio: (index: number) => void;
  setResolutionMode: (mode: Ref2vaResolutionMode) => void;
  setAspect: (width: number, height: number) => void;
  reset: () => void;
}

export function useReferenceSet(): ReferenceSetState {
  const [imageEntries, setImageEntries] = useState<ReferenceImageEntry[]>([]);
  const imageEntriesRef = useRef<ReferenceImageEntry[]>([]);
  const [videos, setVideos] = useState<ReferenceVideoEntry[]>([]);
  const [audios, setAudios] = useState<ReferenceAudioEntry[]>([]);
  const [resolutionMode, setResolutionMode] = useState<Ref2vaResolutionMode>('first_image');
  const [aspectWidth, setAspectWidth] = useState(16);
  const [aspectHeight, setAspectHeight] = useState(9);

  const replaceImageEntries = useCallback((entries: ReferenceImageEntry[]) => {
    imageEntriesRef.current = entries;
    setImageEntries(entries);
  }, []);

  const addImages = useCallback((files: File[]) => {
    const current = imageEntriesRef.current;
    const additions = files.slice(0, REF_IMAGE_MAX - current.length).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    replaceImageEntries([...current, ...additions]);
  }, [replaceImageEntries]);
  const removeImage = useCallback((index: number) => {
    const current = imageEntriesRef.current;
    const removed = current[index];
    if (!removed) return;
    URL.revokeObjectURL(removed.previewUrl);
    replaceImageEntries(current.filter((_, i) => i !== index));
  }, [replaceImageEntries]);
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
  const addAudioPreset = useCallback((preset: { id: string; name: string }) => {
    setAudios((prev) => (
      prev.length >= REF_AUDIO_MAX || prev.some((entry) => entry.presetId === preset.id)
        ? prev
        : [...prev, { presetId: preset.id, presetName: preset.name }]
    ));
  }, []);
  const removeAudioPreset = useCallback((presetId: string) => {
    setAudios((prev) => prev.filter((entry) => entry.presetId !== presetId));
  }, []);
  const removeAudio = useCallback((index: number) => {
    setAudios((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const setAspect = useCallback((width: number, height: number) => {
    setResolutionMode('custom');
    setAspectWidth(Math.max(1, Math.min(100, Math.round(width) || 1)));
    setAspectHeight(Math.max(1, Math.min(100, Math.round(height) || 1)));
  }, []);
  const reset = useCallback(() => {
    for (const entry of imageEntriesRef.current) URL.revokeObjectURL(entry.previewUrl);
    replaceImageEntries([]);
    setVideos([]);
    setAudios([]);
    setResolutionMode('first_image');
    setAspectWidth(16);
    setAspectHeight(9);
  }, [replaceImageEntries]);

  useEffect(() => () => {
    for (const entry of imageEntriesRef.current) URL.revokeObjectURL(entry.previewUrl);
  }, []);

  const images = useMemo(() => imageEntries.map((entry) => entry.file), [imageEntries]);
  const imagePreviewUrls = useMemo(() => imageEntries.map((entry) => entry.previewUrl), [imageEntries]);

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
    imagePreviewUrls,
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
    removeAudioPreset,
    removeAudio,
    setResolutionMode,
    setAspect,
    reset,
  };
}
