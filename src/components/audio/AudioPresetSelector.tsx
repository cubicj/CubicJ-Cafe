'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Music, Plus, Trash2, Check } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface AudioPreset {
  id: string
  name: string
  audioFilename: string
  audioMimeType: string
  audioSize: number
  order: number
}

interface AudioPresetSelectorProps {
  selectedPresetId: string | null
  onPresetChange: (presetId: string | null) => void
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AudioPresetSelector({
  selectedPresetId,
  onPresetChange,
  className,
}: AudioPresetSelectorProps) {
  const [presets, setPresets] = useState<AudioPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPresets = async () => {
    try {
      const data = await apiClient.get<{ presets: AudioPreset[] }>('/api/audio-presets')
      setPresets(data.presets)
    } catch {
      setPresets([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [])

  const togglePreset = (presetId: string) => {
    onPresetChange(selectedPresetId === presetId ? null : presetId)
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newFile) return
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', newName.trim())
      formData.append('audio', newFile)
      await apiClient.postFormData('/api/audio-presets', formData)
      await fetchPresets()
      setNewName('')
      setNewFile(null)
      setIsAddOpen(false)
    } catch {
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (presetId: string) => {
    try {
      await apiClient.delete(`/api/audio-presets/${presetId}`)
      if (selectedPresetId === presetId) onPresetChange(null)
      await fetchPresets()
    } catch {
    }
  }

  if (isLoading) return null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          레퍼런스 오디오 <span className="text-gray-500 font-normal">(선택사항)</span>
        </Label>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>오디오 프리셋 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>프리셋 이름</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="프리셋 이름"
                  maxLength={100}
                />
              </div>
              <div>
                <Label>오디오 파일</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/wav,audio/mpeg,audio/flac,audio/ogg"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {newFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {newFile.name} ({formatFileSize(newFile.size)})
                  </p>
                )}
              </div>
              <Button
                onClick={handleAdd}
                disabled={!newName.trim() || !newFile || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? '업로드 중...' : '추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          등록된 오디오 프리셋이 없습니다.
        </p>
      ) : (
        <div className="space-y-1">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
                selectedPresetId === preset.id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-muted'
              )}
              onClick={() => togglePreset(preset.id)}
            >
              <div className={cn(
                'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                selectedPresetId === preset.id ? 'border-primary bg-primary' : 'border-muted-foreground'
              )}>
                {selectedPresetId === preset.id && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{preset.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {preset.audioFilename} ({formatFileSize(preset.audioSize)})
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(preset.id)
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
