import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { prisma } from '@/lib/database/prisma'
import {
  createWatermarkAsset,
  getWatermarkAssetMetadata,
} from '@/lib/database/watermark-assets'

const WATERMARK_SETTING_KEY = 'ltxr.watermark_image'
const MAX_WATERMARK_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS_BY_MIME_TYPE = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
} as const
const ALLOWED_MIME_TYPES = new Set(Object.keys(ALLOWED_EXTENSIONS_BY_MIME_TYPE))

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: WATERMARK_SETTING_KEY },
    })
    const asset = await getWatermarkAssetMetadata(setting?.value ?? null)

    return { asset }
  }
)

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return badRequest('file is required')
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return badRequest('unsupported file type')
    }

    if (file.size === 0) {
      return badRequest('file is empty')
    }

    if (file.size > MAX_WATERMARK_FILE_SIZE) {
      return badRequest('file is too large')
    }

    const allowedExtensions =
      ALLOWED_EXTENSIONS_BY_MIME_TYPE[file.type as keyof typeof ALLOWED_EXTENSIONS_BY_MIME_TYPE]
    const normalizedFilename = file.name.toLowerCase()

    if (!allowedExtensions.some((extension) => normalizedFilename.endsWith(extension))) {
      return badRequest('file extension does not match file type')
    }

    const asset = await createWatermarkAsset({
      filename: file.name,
      mimeType: file.type,
      imageBlob: Buffer.from(await file.arrayBuffer()),
    })

    return { asset }
  }
)
