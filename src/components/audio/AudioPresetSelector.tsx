'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Check, Play, Square, Music, GripVertical, Pencil } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import AudioPresetDialog from './AudioPresetDialog'
import { AudioPreset, formatFileSize } from '@/types/audio'

interface AudioPresetSelectorProps {
  selectedPresetId: string | null
  onPresetChange: (presetId: string | null) => void
  className?: string
}

export default function AudioPresetSelector({
  selectedPresetId,
  onPresetChange,
  className,
}: AudioPresetSelectorProps) {
  const [presets, setPresets] = useState<AudioPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<AudioPreset | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const handlePlay = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return

    if (playingId === presetId) {
      audio.pause()
      audio.currentTime = 0
      setPlayingId(null)
      return
    }

    audio.src = `/api/audio-presets/${presetId}/stream`
    audio.play()
    setPlayingId(presetId)
  }

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

  const handleAdd = async (name: string, file: File | null) => {
    if (!file) return
    const formData = new FormData()
    formData.append('name', name)
    formData.append('audio', file)
    await apiClient.postFormData('/api/audio-presets', formData)
    await fetchPresets()
    setIsAddOpen(false)
  }

  const handleEdit = async (name: string, file: File | null) => {
    if (!editingPreset) return
    const formData = new FormData()
    formData.append('name', name)
    if (file) formData.append('audio', file)
    await apiClient.putFormData(`/api/audio-presets/${editingPreset.id}`, formData)
    await fetchPresets()
    setEditingPreset(null)
  }

  const handleDelete = async (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation()
    try {
      await apiClient.delete(`/api/audio-presets/${presetId}`)
      if (selectedPresetId === presetId) onPresetChange(null)
      await fetchPresets()
    } catch {
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(presets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setPresets(items)
    apiClient.put('/api/audio-presets/reorder', {
      presetIds: items.map((p) => p.id),
    }).catch(() => {
      fetchPresets()
    })
  }

  if (isLoading) return null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          등록된 오디오 프리셋이 없습니다.
        </p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="audio-presets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1"
              >
                {presets.map((preset, index) => (
                  <Draggable key={preset.id} draggableId={preset.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          'flex items-center gap-2 sm:gap-2 p-3 sm:p-2 rounded-md cursor-pointer transition-colors',
                          snapshot.isDragging && 'shadow-lg ring-2 ring-blue-500 ring-opacity-50',
                          selectedPresetId === preset.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => togglePreset(preset.id)}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-move shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
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
                          className={cn(
                            'h-9 w-9 sm:h-7 sm:w-7 p-0 shrink-0 transition-colors',
                            playingId === preset.id
                              ? 'text-primary bg-primary/10 hover:bg-destructive/10 hover:text-destructive'
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                          )}
                          onClick={(e) => handlePlay(e, preset.id)}
                        >
                          {playingId === preset.id ? (
                            <Square className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 sm:h-7 sm:w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPreset(preset)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 sm:h-7 sm:w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(e, preset.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <AudioPresetDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAdd}
      />

      <AudioPresetDialog
        open={!!editingPreset}
        onOpenChange={(open) => { if (!open) setEditingPreset(null) }}
        onSubmit={handleEdit}
        preset={editingPreset}
      />

      <audio
        ref={audioRef}
        hidden
        onEnded={() => setPlayingId(null)}
        onError={() => setPlayingId(null)}
      />
    </div>
  )
}
