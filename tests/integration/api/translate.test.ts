import { vi } from 'vitest'
import { buildRequest } from '../../helpers/auth'

import { POST } from '@/app/api/translate/route'

const fetchSpy = vi.spyOn(globalThis, 'fetch')

afterEach(() => {
  fetchSpy.mockReset()
})

describe('POST /api/translate', () => {
  it('returns 400 for invalid JSON', async () => {
    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when text is missing', async () => {
    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ service: 'google', sourceLang: 'ko', targetLang: 'en' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for unsupported service', async () => {
    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'hello', service: 'deepl', sourceLang: 'ko', targetLang: 'en' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('translates with google service', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([[['translated text', 'original text']]]), { status: 200 })
    )

    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'original text', service: 'google', sourceLang: 'ko', targetLang: 'en' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.translatedText).toBe('translated text')
    expect(body.originalText).toBe('original text')
    expect(body.service).toBe('google')
    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it('translates with gemini service', async () => {
    process.env.GEMINI_API_KEY = 'test-key'

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'gemini translated' }] } }]
      }), { status: 200 })
    )

    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'hello', service: 'gemini', sourceLang: 'en', targetLang: 'ko' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.translatedText).toBe('gemini translated')
    expect(body.service).toBe('gemini')

    delete process.env.GEMINI_API_KEY
  })

  it('returns 500 when google API fails', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('error', { status: 500 }))

    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'test', service: 'google', sourceLang: 'ko', targetLang: 'en' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 500 when gemini API key is missing', async () => {
    delete process.env.GEMINI_API_KEY

    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'test', service: 'gemini', sourceLang: 'ko', targetLang: 'en' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 400 when text exceeds max length', async () => {
    const req = buildRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'a'.repeat(10001), service: 'google', sourceLang: 'ko', targetLang: 'en' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
