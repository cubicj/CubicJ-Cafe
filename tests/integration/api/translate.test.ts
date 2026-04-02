import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { buildRequest, buildAuthenticatedRequest, createTestSession } from '../../helpers/auth'

import { POST } from '@/app/api/translate/route'

const fetchSpy = vi.spyOn(globalThis, 'fetch')

let sessionId: string

beforeAll(async () => {
  await cleanTables()
  const user = await createUser()
  const session = await createTestSession(user.id)
  sessionId = session.id
})

afterEach(() => {
  fetchSpy.mockReset()
})

function authReq(body: string | object) {
  return buildAuthenticatedRequest('/api/translate', sessionId, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/translate', () => {
  it('returns 401 for unauthenticated request', async () => {
    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'hello', sourceLang: 'ko', targetLang: 'en' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON', async () => {
    const req = authReq('not json')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when text is missing', async () => {
    const req = authReq({ sourceLang: 'ko', targetLang: 'en' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('translates with google', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([[['translated text', 'original text']]]), { status: 200 })
    )

    const req = authReq({ text: 'original text', sourceLang: 'ko', targetLang: 'en' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.translatedText).toBe('translated text')
    expect(body.originalText).toBe('original text')
    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it('returns 500 when google API fails', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('error', { status: 500 }))

    const req = authReq({ text: 'test', sourceLang: 'ko', targetLang: 'en' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 400 when text exceeds max length', async () => {
    const req = authReq({ text: 'a'.repeat(10001), sourceLang: 'ko', targetLang: 'en' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
