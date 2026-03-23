import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { createTestSession } from '../../helpers/auth'

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

import { POST } from '@/app/api/i2v/route'
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state'
import { serverManager } from '@/lib/comfyui/server-manager'

beforeEach(async () => {
  await cleanTables()
  vi.mocked(isComfyUIEnabled).mockReturnValue(true)
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
  form.set('duration', '5')
  form.set('isNSFW', 'false')
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
    form.set('duration', '5')
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
    expect(body.success).toBe(true)
    expect(body.requestId).toBeDefined()
    expect(body.message).toContain('큐')
  })

  it('returns 400 for invalid duration', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const form = buildFormData({ duration: '99' })
    const req = buildFormDataRequest('/api/i2v', session.id, form)
    const { NextRequest } = await import('next/server')
    const nextReq = new NextRequest(req)
    const res = await POST(nextReq)
    expect(res.status).toBe(400)
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
})
