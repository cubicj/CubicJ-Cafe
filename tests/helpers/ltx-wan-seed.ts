import { prisma } from '@/lib/database/prisma'

type SeedType = 'string' | 'number' | 'boolean'

export const LTX_WAN_SEED: Array<{ key: string; value: string; type: SeedType }> = [
  { key: 'ltx-wan.clip_vision_model', value: 'test-clip-vision.safetensors', type: 'string' },
]

export async function seedLtxWan(): Promise<void> {
  await prisma.systemSetting.createMany({
    data: LTX_WAN_SEED.map((row) => ({
      key: row.key,
      value: row.value,
      type: row.type,
      category: 'ltx-wan',
    })),
  })
}
