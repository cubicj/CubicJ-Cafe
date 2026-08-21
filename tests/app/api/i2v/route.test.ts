import { vi } from 'vitest'
import { cleanTables } from '@tests/helpers/db'
import { createUser } from '@tests/helpers/fixtures'
import { buildAuthenticatedRequest, createTestSession } from '@tests/helpers/auth'
import { seedH3Ref2va } from '@tests/helpers/h3-ref2va-seed'
import { seedLtxrSettings } from '@tests/helpers/ltxr-seed'
import { prisma } from '@/lib/database/prisma'

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: vi.fn(() => true),
}))

vi.mock('@/lib/comfyui/server-manager', () => ({
  serverManager: {
    checkServerHealth: vi.fn(),
    selectBestServer: vi.fn(() => ({
      id: 'local',
      type: 'LOCAL',
      url: 'http://localhost:8188',
    })),
  },
}))

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
}))

vi.mock('@/lib/database/system-settings', () => ({
  getWanSettings: vi.fn(() => ({ loraEnabled: true, durationOptions: [5, 6, 7] })),
  getLtxaSettings: vi.fn(() => ({ loraEnabled: false, durationOptions: [5, 6, 7] })),
  getLtxrSettings: vi.fn(() => ({ loraEnabled: false, durationOptions: [5, 6, 7], frameBase: 11, frameRate: 19 })),
  getLtxWanSettings: vi.fn(() => ({ loraEnabledWan: false, durationOptions: [5, 6, 7, 8] })),
  getH3Fl2vaSettings: vi.fn(() => ({ durationOptions: [5, 7], framesPerStep: 10, frameBase: 3, frameRate: 10 })),
  getH3Ref2vaSettings: vi.fn(() => ({ durationOptions: [7], framesPerStep: 10, frameBase: 3, frameRate: 10 })),
  getEnabledModels: vi.fn(() => ['wan', 'ltxa', 'ltx-wan']),
}))

import { POST } from '@/app/api/i2v/route'
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state'
import { serverManager } from '@/lib/comfyui/server-manager'
import { getEnabledModels, getLtxaSettings } from '@/lib/database/system-settings'

beforeEach(async () => {
  await cleanTables()
  vi.mocked(isComfyUIEnabled).mockReturnValue(true)
  vi.mocked(getEnabledModels).mockResolvedValue(['wan', 'ltxa', 'ltx-wan'])
  vi.mocked(serverManager.selectBestServer).mockReturnValue({
    id: 'local',
    type: 'LOCAL',
    url: 'http://localhost:8188',
    isActive: true,
    activeJobs: 0,
    maxJobs: 1,
    priority: 2,
  })
})

function buildFormData(overrides?: Record<string, string | Blob>) {
  const form = new FormData()
  form.set('prompt', 'a cat walking in the garden')
  form.set('image', new File(['fake-image-data'], 'test.png', { type: 'image/png' }))
  form.set('isNSFW', 'false')
  form.set('videoDuration', '5')
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      form.set(key, value)
    }
  }
  return form
}

function buildFormDataRequest(url: string, sessionId: string, formData: FormData) {
  return new Request(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    body: formData,
    headers: {
      cookie: `session_id=${sessionId}`,
    },
  })
}

function buildReferenceFormData(overrides?: Record<string, string | Blob>) {
  const form = new FormData()
  form.set('prompt', 'a fake reference prompt')
  form.set('model', 'h3-ref2va')
  form.set('isNSFW', 'false')
  form.set('videoDuration', '7')
  form.set('resolutionMode', 'first_image')
  form.set('refImage_0', new File(['fake-reference-image'], 'fake-reference.png', { type: 'image/png' }))
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      form.set(key, value)
    }
  }
  return form
}

describe('POST /api/i2v', () => {
  it('returns 401 when not authenticated', async () => {
    const form = buildFormData()
    const req = new Request(new URL('/api/i2v', 'http://localhost:3000'), {
      method: 'POST',
      body: form,
    })
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    expect(res.status).toBe(401)
  })

  it('returns 503 when ComfyUI is disabled', async () => {
    vi.mocked(isComfyUIEnabled).mockReturnValue(false)

    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData()
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toContain('비활성')
  })

  it('returns 503 when no server available', async () => {
    vi.mocked(serverManager.selectBestServer).mockReturnValue(null)

    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData()
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toContain('서버')
  })

  it('returns 400 when prompt is missing', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData()
    form.delete('prompt')
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    expect(res.status).toBe(400)
  })

  it('returns 400 when image is missing', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = new FormData()
    form.set('prompt', 'test prompt')
    form.set('isNSFW', 'false')
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    expect(res.status).toBe(400)
  })

  it('creates queue request on valid submission', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData()
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.requestId).toBeDefined()
    expect(body.message).toContain('큐')
  })

  it('returns 400 for oversized image', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.png', { type: 'image/png' })
    const form = buildFormData({ image: bigFile })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-image file', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const form = buildFormData({ image: textFile })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    expect(res.status).toBe(400)
  })

  it('returns 400 when videoDuration is out of range', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ videoDuration: '99' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    expect(res.status).toBe(400)
  })

  it('returns 400 when selected model is disabled', async () => {
    vi.mocked(getEnabledModels).mockResolvedValue(['ltxa', 'ltx-wan'])

    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ model: 'wan' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('비활성')
  })

  it('stores videoDuration in queue request', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ videoDuration: '7' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    const body = await res.json()
    expect(res.status).toBe(200)

    const { prisma } = await import('@/lib/database/prisma')
    const queueRequest = await prisma.queueRequest.findUnique({
      where: { id: body.requestId },
      select: { videoDuration: true },
    })
    expect(queueRequest?.videoDuration).toBe(7)
  })

  it('stores LTXA N and requested actual seconds in queue request', async () => {
    vi.mocked(getLtxaSettings).mockResolvedValue({
      loraEnabled: false,
      durationOptions: [24],
      frameBase: 8,
      frameRate: 25,
    } as unknown as Awaited<ReturnType<typeof getLtxaSettings>>)
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ model: 'ltxa', videoDuration: '24' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    const body = await res.json()
    expect(res.status).toBe(200)

    const { prisma } = await import('@/lib/database/prisma')
    const rows = await prisma.$queryRaw<Array<{ video_duration: number; video_duration_seconds: number }>>`
      SELECT video_duration, video_duration_seconds
      FROM queue_requests
      WHERE id = ${body.requestId}
    `

    expect(rows[0]).toEqual({
      video_duration: 24,
      video_duration_seconds: 7.7,
    })
  })

  it('stores LTXR queue requests as SFW even when submitted NSFW', async () => {
    vi.mocked(getEnabledModels).mockResolvedValue(
      ['ltxr'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
    )
    await seedLtxrSettings(prisma, { 'ltxr.enabled': true })

    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ model: 'ltxr', isNSFW: 'true' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    const body = await res.json()

    expect(res.status).toBe(200)

    const queueRequest = await prisma.queueRequest.findUnique({
      where: { id: body.requestId },
      select: { videoModel: true, isNSFW: true },
    })

    expect(queueRequest).toEqual({
      videoModel: 'ltxr',
      isNSFW: false,
    })
  })

  it('accepts an h3-fl2va request with only an end image and stores END_ONLY', async () => {
    vi.mocked(getEnabledModels).mockResolvedValue(
      ['h3-fl2va'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
    )
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = new FormData()
    form.set('prompt', 'ending scene')
    form.set('model', 'h3-fl2va')
    form.set('isNSFW', 'false')
    form.set('videoDuration', '5')
    form.set('endImage', new File(['fake-end-image'], 'end.png', { type: 'image/png' }))
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const res = await POST(new NextRequest(req))
    const body = await res.json()
    expect(res.status).toBe(200)

    const row = await prisma.queueRequest.findUnique({
      where: { id: body.requestId },
      select: { generationMode: true, imageFile: true, endImageFile: true, videoDuration: true, videoDurationSeconds: true },
    })
    expect(row?.generationMode).toBe('END_ONLY')
    expect(row?.imageFile).toBeNull()
    expect(row?.endImageFile).not.toBeNull()
    expect(row?.videoDuration).toBe(5)
    expect(row?.videoDurationSeconds).toBe(5.3)
  })

  it('rejects an h3-fl2va request with no images', async () => {
    vi.mocked(getEnabledModels).mockResolvedValue(
      ['h3-fl2va'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
    )
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = new FormData()
    form.set('prompt', 'no images')
    form.set('model', 'h3-fl2va')
    form.set('isNSFW', 'false')
    form.set('videoDuration', '5')
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const res = await POST(new NextRequest(req))
    expect(res.status).toBe(400)
  })

  it('stores START_ONLY for h3-fl2va with only a start image', async () => {
    vi.mocked(getEnabledModels).mockResolvedValue(
      ['h3-fl2va'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
    )
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ model: 'h3-fl2va' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const res = await POST(new NextRequest(req))
    const body = await res.json()
    expect(res.status).toBe(200)
    const row = await prisma.queueRequest.findUnique({
      where: { id: body.requestId },
      select: { generationMode: true },
    })
    expect(row?.generationMode).toBe('START_ONLY')
  })

  it('rejects an h3-fl2va duration outside the configured options', async () => {
    vi.mocked(getEnabledModels).mockResolvedValue(
      ['h3-fl2va'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
    )
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ model: 'h3-fl2va', videoDuration: '6' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const res = await POST(new NextRequest(req))

    expect(res.status).toBe(400)
  })

  it.each([
    { label: 'start and end images', start: true, end: true, expectedMode: 'LOOP' },
    { label: 'only an end image', start: false, end: true, expectedMode: 'END_ONLY' },
    { label: 'only a start image', start: true, end: false, expectedMode: 'START_ONLY' },
  ])('derives $expectedMode for loop-marked h3-fl2va requests with $label', async ({ start, end, expectedMode }) => {
    vi.mocked(getEnabledModels).mockResolvedValue(
      ['h3-fl2va'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
    )
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = new FormData()
    form.set('prompt', 'fake loop prompt')
    form.set('model', 'h3-fl2va')
    form.set('isNSFW', 'false')
    form.set('isLoop', 'true')
    form.set('videoDuration', '5')
    if (start) form.set('image', new File(['fake-start-data'], 'fake-start.png', { type: 'image/png' }))
    if (end) form.set('endImage', new File(['fake-end-data'], 'fake-end.png', { type: 'image/png' }))
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const res = await POST(new NextRequest(req))
    const body = await res.json()

    expect(res.status).toBe(200)
    const row = await prisma.queueRequest.findUnique({
      where: { id: body.requestId },
      select: { generationMode: true },
    })
    expect(row?.generationMode).toBe(expectedMode)
  })

  describe('h3-ref2va submissions', () => {
    beforeEach(async () => {
      await seedH3Ref2va()
      vi.mocked(getEnabledModels).mockResolvedValue(
        ['wan', 'h3-ref2va'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
      )
    })

    it.each([
      ['h3-ref2va first', ['h3-ref2va', 'wan']],
      ['h3-ref2va last', ['wan', 'h3-ref2va']],
    ])('rejects duplicate model fields with $0', async (_label, models) => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildReferenceFormData()
      form.delete('model')
      for (const model of models) form.append('model', model)
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe('model 필드는 하나여야 합니다.')
      expect(await prisma.queueRequest.count()).toBe(0)
    })

    it('stores ordered reference files for a valid submission', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const preset = await prisma.audioPreset.create({
        data: {
          userId: user.id,
          name: 'Fake Reference Preset',
          audioBlob: new Uint8Array([11, 22, 33]),
          audioFilename: 'fake-reference.wav',
          audioMimeType: 'audio/wav',
          audioSize: 3,
        },
      })
      const form = buildReferenceFormData({
        refImage_1: new File(['fake-second-image'], 'fake-second.webp', { type: 'image/webp' }),
        refVideo_0: new File(['fake-video'], 'fake-video.mp4', { type: 'video/mp4' }),
        refVideoSoundtrack_0: 'true',
        refAudioPresetId_0: preset.id,
      })
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      const request = await prisma.queueRequest.findUnique({
        where: { id: body.requestId },
        select: {
          generationMode: true,
          resolutionMode: true,
          referenceFiles: true,
        },
      })
      expect(request?.generationMode).toBe('REFERENCE')
      expect(request?.resolutionMode).toBe('first_image')
      expect(request?.referenceFiles).toHaveLength(4)
      expect(request?.referenceFiles).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'IMAGE', slot: 0, includeSoundtrack: false, audioPresetName: null }),
        expect.objectContaining({ kind: 'IMAGE', slot: 1, includeSoundtrack: false, audioPresetName: null }),
        expect.objectContaining({ kind: 'VIDEO', slot: 0, includeSoundtrack: true, audioPresetName: null }),
        expect.objectContaining({ kind: 'AUDIO', slot: 0, includeSoundtrack: false, audioPresetName: 'Fake Reference Preset' }),
      ]))
    })

    it('stores custom aspect values', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildReferenceFormData({
        resolutionMode: 'custom',
        aspectWidth: '13',
        aspectHeight: '8',
      })
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      const request = await prisma.queueRequest.findUnique({
        where: { id: body.requestId },
        select: { resolutionMode: true, aspectWidth: true, aspectHeight: true },
      })
      expect(request).toEqual({ resolutionMode: 'custom', aspectWidth: 13, aspectHeight: 8 })
    })

    it('rejects a submission with no references', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildReferenceFormData({ resolutionMode: 'custom', aspectWidth: '5', aspectHeight: '4' })
      form.delete('refImage_0')
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('rejects first_image mode without an image reference', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildReferenceFormData({
        refAudioFile_0: new File(['fake-audio'], 'fake-audio.ogg', { type: 'audio/ogg' }),
      })
      form.delete('refImage_0')
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('returns a Korean error for an unsupported reference duration', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildReferenceFormData({ videoDuration: '6' })
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe('영상 길이는 7 중 하나여야 합니다.')
    })

    it('rejects an unknown audio preset', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildReferenceFormData({ refAudioPresetId_0: 'missing-fake-preset' })
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toBe('오디오 프리셋을 찾을 수 없습니다.')
    })

    it('rejects the disabled reference model', async () => {
      await prisma.systemSetting.update({
        where: { key: 'h3-ref2va.enabled' },
        data: { value: 'false' },
      })
      vi.mocked(getEnabledModels).mockResolvedValue(
        ['wan'] as unknown as Awaited<ReturnType<typeof getEnabledModels>>
      )
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildReferenceFormData()
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('비활성')
    })

    it('keeps the legacy wan submission path working', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const form = buildFormData({ model: 'wan' })
      const req = buildAuthenticatedRequest('/api/i2v', session.id, { method: 'POST', body: form })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      const request = await prisma.queueRequest.findUnique({
        where: { id: body.requestId },
        select: { videoModel: true, generationMode: true, referenceFiles: true },
      })
      expect(request).toEqual({ videoModel: 'wan', generationMode: 'START_ONLY', referenceFiles: [] })
    })
  })
})
