import { prisma } from '@/lib/database/prisma'
import { createLogger } from '@/lib/logger'

const log = createLogger('audio-preset')

const PRESET_SELECT_WITHOUT_BLOB = {
  id: true,
  userId: true,
  name: true,
  audioFilename: true,
  audioMimeType: true,
  audioSize: true,
  order: true,
  createdAt: true,
  updatedAt: true,
} as const

export type AudioPresetListItem = Awaited<ReturnType<typeof AudioPresetService.getUserPresets>>[number]

export interface CreateAudioPresetData {
  name: string
  audioBlob: Uint8Array
  audioFilename: string
  audioMimeType: string
  audioSize: number
}

export class AudioPresetService {
  static async getUserPresets(userId: number) {
    return prisma.audioPreset.findMany({
      where: { userId },
      select: PRESET_SELECT_WITHOUT_BLOB,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
  }

  static async getPresetWithBlob(presetId: string, userId: number) {
    return prisma.audioPreset.findFirst({
      where: { id: presetId, userId },
    })
  }

  static async createPreset(userId: number, data: CreateAudioPresetData) {
    const preset = await prisma.audioPreset.create({
      data: {
        userId,
        name: data.name,
        audioBlob: data.audioBlob as Uint8Array<ArrayBuffer>,
        audioFilename: data.audioFilename,
        audioMimeType: data.audioMimeType,
        audioSize: data.audioSize,
      },
      select: PRESET_SELECT_WITHOUT_BLOB,
    })

    log.info('Audio preset created', { name: preset.name, id: preset.id })
    return preset
  }

  static async renamePreset(presetId: string, userId: number, name: string) {
    const existing = await prisma.audioPreset.findFirst({
      where: { id: presetId, userId },
    })
    if (!existing) return null

    return prisma.audioPreset.update({
      where: { id: presetId },
      data: { name },
      select: PRESET_SELECT_WITHOUT_BLOB,
    })
  }

  static async deletePreset(presetId: string, userId: number): Promise<boolean> {
    const existing = await prisma.audioPreset.findFirst({
      where: { id: presetId, userId },
    })
    if (!existing) return false

    await prisma.audioPreset.delete({ where: { id: presetId } })
    log.info('Audio preset deleted', { name: existing.name, presetId })
    return true
  }

  static async reorderPresets(userId: number, presetIds: string[]) {
    const userPresets = await prisma.audioPreset.findMany({
      where: { userId, id: { in: presetIds } },
      select: { id: true },
    })

    if (userPresets.length !== presetIds.length) {
      throw new Error('일부 프리셋에 대한 권한이 없습니다')
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < presetIds.length; i++) {
        await tx.audioPreset.update({
          where: { id: presetIds[i] },
          data: { order: i },
        })
      }
    })
  }

  static async getAllPresets(userId?: number) {
    return prisma.audioPreset.findMany({
      where: userId ? { userId } : undefined,
      select: {
        ...PRESET_SELECT_WITHOUT_BLOB,
        user: { select: { nickname: true } },
      },
      orderBy: [{ userId: 'asc' }, { order: 'asc' }],
    })
  }

  static async adminDeletePreset(presetId: string): Promise<boolean> {
    const existing = await prisma.audioPreset.findUnique({
      where: { id: presetId },
    })
    if (!existing) return false

    await prisma.audioPreset.delete({ where: { id: presetId } })
    log.info('Audio preset deleted by admin', { presetId })
    return true
  }
}
