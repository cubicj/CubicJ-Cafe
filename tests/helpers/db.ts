import { prisma } from '@/lib/database/prisma'
import { QueueService } from '@/lib/database/queue'
import { seedOps } from './ops-seed'

export async function cleanTables() {
  await prisma.loRAPresetItem.deleteMany()
  await prisma.loRAPreset.deleteMany()
  await prisma.audioPreset.deleteMany()
  await prisma.queueRequest.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemSetting.deleteMany()
  await prisma.loRABundle.deleteMany()

  await seedOps()

  QueueService.invalidateCache()
}
