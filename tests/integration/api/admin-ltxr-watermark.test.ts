import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { GET, POST } from '@/app/api/admin/ltxr/watermark/route'
import { prisma } from '@/lib/database/prisma'

beforeEach(async () => {
  await cleanTables()
})

function buildWatermarkForm(file: File | Blob | null) {
  const form = new FormData()
  if (file) form.set('file', file)
  return form
}

async function buildAdminSession() {
  const admin = await createAdminUser()
  return createTestSession(admin.id)
}

describe('GET /api/admin/ltxr/watermark', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/ltxr/watermark')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id)
    const res = await GET(req)

    expect(res.status).toBe(403)
  })

  it('returns metadata without image bytes', async () => {
    const session = await buildAdminSession()
    const image = new File([new Uint8Array([137, 80, 78, 71])], 'fake.png', {
      type: 'image/png',
    })
    const postReq = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(image),
    })
    await POST(postReq)

    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.asset).toEqual({
      id: expect.any(String),
      filename: 'fake.png',
      mimeType: 'image/png',
      size: 4,
    })
    expect(body.asset.imageBlob).toBeUndefined()
  })
})

describe('POST /api/admin/ltxr/watermark', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/ltxr/watermark', {
      method: 'POST',
      body: buildWatermarkForm(new File([new Uint8Array([1])], 'fake.png', { type: 'image/png' })),
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(new File([new Uint8Array([1])], 'fake.png', { type: 'image/png' })),
    })
    const res = await POST(req)

    expect(res.status).toBe(403)
  })

  it('stores uploaded image metadata and updates ltxr.watermark_image', async () => {
    const session = await buildAdminSession()
    const image = new File([new Uint8Array([255, 216, 255, 224, 0])], 'watermark.jpg', {
      type: 'image/jpeg',
    })
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(image),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.asset).toEqual({
      id: expect.any(String),
      filename: 'watermark.jpg',
      mimeType: 'image/jpeg',
      size: 5,
    })
    expect(body.asset.imageBlob).toBeUndefined()

    const stored = await prisma.watermarkAsset.findUnique({
      where: { id: body.asset.id },
    })
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ltxr.watermark_image' },
    })

    expect(Array.from(stored?.imageBlob ?? [])).toEqual([255, 216, 255, 224, 0])
    expect(setting?.value).toBe(body.asset.id)
  })

  it('rejects unsupported file type', async () => {
    const session = await buildAdminSession()
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(new File([new Uint8Array([1])], 'fake.gif', { type: 'image/gif' })),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('rejects missing file', async () => {
    const session = await buildAdminSession()
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(null),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('rejects empty file', async () => {
    const session = await buildAdminSession()
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(new File([], 'empty.webp', { type: 'image/webp' })),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('rejects files larger than 10 MB', async () => {
    const session = await buildAdminSession()
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
      ),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('rejects files with an extension that does not match the MIME type', async () => {
    const session = await buildAdminSession()
    const req = buildAuthenticatedRequest('/api/admin/ltxr/watermark', session.id, {
      method: 'POST',
      body: buildWatermarkForm(
        new File([new Uint8Array([1])], 'watermark.png', { type: 'image/jpeg' })
      ),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })
})
