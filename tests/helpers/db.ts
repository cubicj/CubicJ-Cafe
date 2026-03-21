import { prisma } from '@/lib/database/prisma'
import { queueService } from '@/lib/database/queue'

export async function cleanTables() {
  await prisma.loRAPresetItem.deleteMany()
  await prisma.loRAPreset.deleteMany()
  await prisma.queueRequest.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemSetting.deleteMany()
  await prisma.loRABundle.deleteMany()

  queueService.invalidateCache()
}
