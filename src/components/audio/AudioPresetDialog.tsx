'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Music, Play, Square } from 'lucide-react'

interface AudioPreset {
  id: string
  name: string
  audioFilename: string
  audioMimeType: string
  audioSize: number
  order: number
}

interface AudioPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, file: File | null) => Promise<void>
  preset?: AudioPreset | null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AudioPresetDialog({
  open,
  onOpenChange,
  onSubmit,
  preset,
}: AudioPresetDialogProps) {
  const isEdit = !!preset
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(preset?.name ?? '')
      setFile(null)
      setIsPlaying(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [open, preset])

  const handleFileChange = (f: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setFile(f)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const getAudioSrc = (): string | null => {
    if (file) {
      if (!objectUrlRef.current) {
        objectUrlRef.current = URL.createObjectURL(file)
      }
      return objectUrlRef.current
    }
    if (isEdit && preset) {
      return `/api/audio-presets/${preset.id}/stream`
    }
    return null
  }

  const handlePlayToggle = () => {
    const audio = audioRef.current
    const src = getAudioSrc()
    if (!audio || !src) return

    if (isPlaying) {
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
      return
    }

    audio.src = src
    audio.play()
    setIsPlaying(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    if (!isEdit && !file) return
    setIsSubmitting(true)
    try {
      await onSubmit(name.trim(), file)
    } finally {
      setIsSubmitting(false)
    }
  }

  const audioSrc = getAudioSrc()
  const canSubmit = isEdit ? !!name.trim() : !!name.trim() && !!file
  const currentFileInfo = file
    ? `${file.name} (${formatFileSize(file.size)})`
    : isEdit && preset
      ? `${preset.audioFilename} (${formatFileSize(preset.audioSize)})`
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '오디오 프리셋 수정' : '오디오 프리셋 추가'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label>프리셋 이름</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="프리셋 이름"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>오디오 파일{isEdit && ' (변경하지 않으려면 비워두세요)'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/wav,audio/mpeg,audio/flac,audio/ogg"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start font-normal"
              onClick={() => fileInputRef.current?.click()}
            >
              <Music className="h-4 w-4 mr-2 shrink-0" />
              {file ? (
                <span className="truncate">{file.name} ({formatFileSize(file.size)})</span>
              ) : (
                <span className="text-muted-foreground">
                  {isEdit ? '새 파일 선택 (WAV, MP3, FLAC, OGG)' : '파일 선택 (WAV, MP3, FLAC, OGG)'}
                </span>
              )}
            </Button>
          </div>
          {audioSrc && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handlePlayToggle}
              >
                {isPlaying ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm text-muted-foreground truncate">
                {currentFileInfo}
              </span>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full mt-2"
          >
            {isSubmitting ? (isEdit ? '저장 중...' : '업로드 중...') : (isEdit ? '저장' : '추가')}
          </Button>
        </div>
        <audio
          ref={audioRef}
          hidden
          onEnded={() => setIsPlaying(false)}
          onError={() => setIsPlaying(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
