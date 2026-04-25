'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface AudioPresetAdmin {
  id: string
  userId: number
  name: string
  audioFilename: string
  audioMimeType: string
  audioSize: number
  order: number
  createdAt: string
  user: { nickname: string }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AudioPresetAdminManager() {
  const [presets, setPresets] = useState<AudioPresetAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterUserId, setFilterUserId] = useState<string>('all')

  const fetchPresets = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = filterUserId !== 'all' ? `?userId=${filterUserId}` : ''
      const data = await apiClient.get<{ presets: AudioPresetAdmin[] }>(`/api/admin/audio-presets${query}`)
      setPresets(data.presets)
    } catch {
      setPresets([])
    } finally {
      setIsLoading(false)
    }
  }, [filterUserId])

  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  const handleDelete = async (presetId: string) => {
    try {
      await apiClient.delete(`/api/admin/audio-presets/${presetId}`)
      await fetchPresets()
    } catch {
    }
  }

  const uniqueUsers = Array.from(
    new Map(presets.map((p) => [p.userId, p.user.nickname])).entries()
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={filterUserId} onValueChange={setFilterUserId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="유저 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유저</SelectItem>
            {uniqueUsers.map(([id, nickname]) => (
              <SelectItem key={id} value={String(id)}>
                {nickname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{presets.length}개 프리셋</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      ) : presets.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 오디오 프리셋이 없습니다.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium">유저</th>
                <th className="text-left p-2 font-medium">프리셋 이름</th>
                <th className="text-left p-2 font-medium">파일명</th>
                <th className="text-right p-2 font-medium">크기</th>
                <th className="text-right p-2 font-medium">생성일</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.id} className="border-t hover:bg-muted/30">
                  <td className="p-2">{preset.user.nickname}</td>
                  <td className="p-2 font-medium">{preset.name}</td>
                  <td className="p-2 text-muted-foreground truncate max-w-[200px]">{preset.audioFilename}</td>
                  <td className="p-2 text-right text-muted-foreground">{formatFileSize(preset.audioSize)}</td>
                  <td className="p-2 text-right text-muted-foreground">
                    {new Date(preset.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDelete(preset.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
