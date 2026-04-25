import { NextRequest } from 'next/server'
import type { RequestInit as NextRequestInit } from 'next/dist/server/web/spec-extension/request'
import { middleware, resetRateLimitForTests } from '../../middleware'

function createRequest(path: string, init?: NextRequestInit) {
  return new NextRequest(new URL(path, 'http://localhost:3000'), init)
}

beforeEach(() => {
  resetRateLimitForTests()
})

describe('middleware', () => {
  it('adds security headers', () => {
    const res = middleware(createRequest('/'))

    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('rate limits configured API routes', async () => {
    let res = middleware(createRequest('/api/i2v', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.10' },
    }))

    for (let i = 0; i < 10; i += 1) {
      res = middleware(createRequest('/api/i2v', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.10' },
      }))
    }

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeDefined()
    expect(await res.json()).toEqual({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' })
  })

  it('does not rate limit unrelated routes', () => {
    let res = middleware(createRequest('/api/health', {
      method: 'GET',
      headers: { 'x-forwarded-for': '203.0.113.20' },
    }))

    for (let i = 0; i < 200; i += 1) {
      res = middleware(createRequest('/api/health', {
        method: 'GET',
        headers: { 'x-forwarded-for': '203.0.113.20' },
      }))
    }

    expect(res.status).not.toBe(429)
  })
})
