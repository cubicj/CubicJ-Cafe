import { prisma } from '@/lib/database/prisma'

const WATERMARK_SETTING_KEY = 'ltxr.watermark_image'

export interface WatermarkAssetMetadata {
  id: string
  filename: string
  mimeType: string
  size: number
}

function toMetadata(asset: WatermarkAssetMetadata): WatermarkAssetMetadata {
  return {
    id: asset.id,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
  }
}

export async function createWatermarkAsset(input: {
  filename: string
  mimeType: string
  imageBlob: Buffer | Uint8Array
}): Promise<WatermarkAssetMetadata> {
  return prisma.$transaction(async (tx) => {
    const imageBlob = Buffer.from(input.imageBlob)
    const asset = await tx.watermarkAsset.create({
      data: {
        filename: input.filename,
        mimeType: input.mimeType,
        size: imageBlob.byteLength,
        imageBlob,
      },
    })

    await tx.systemSetting.upsert({
      where: { key: WATERMARK_SETTING_KEY },
      update: {
        value: asset.id,
        type: 'string',
        category: 'ltxr',
      },
      create: {
        key: WATERMARK_SETTING_KEY,
        value: asset.id,
        type: 'string',
        category: 'ltxr',
      },
    })

    return toMetadata(asset)
  })
}

export async function getWatermarkAssetMetadata(id: string | null): Promise<WatermarkAssetMetadata | null> {
  const assetId = id?.trim()
  if (!assetId) return null

  const asset = await prisma.watermarkAsset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
    },
  })

  return asset ? toMetadata(asset) : null
}

export async function getWatermarkAssetBlob(id: string): Promise<{
  filename: string
  mimeType: string
  imageBlob: Uint8Array | Buffer
}> {
  const asset = await prisma.watermarkAsset.findUniqueOrThrow({
    where: { id },
    select: {
      filename: true,
      mimeType: true,
      imageBlob: true,
    },
  })

  return asset
}
