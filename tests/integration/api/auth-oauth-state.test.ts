import { POST } from '@/app/api/auth/discord/route'
import { buildRequest } from '../../helpers/auth'

describe('POST /api/auth/discord', () => {
  it('returns Discord auth URL with state parameter', async () => {
    const req = buildRequest('/api/auth/discord', { method: 'POST' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.url).toContain('https://discord.com/api/oauth2/authorize')
    expect(body.url).toContain('state=')
    expect(body.url).toContain('client_id=')
    expect(body.url).toContain('scope=identify')
  })

  it('sets oauth_state HttpOnly cookie', async () => {
    const req = buildRequest('/api/auth/discord', { method: 'POST' })
    const res = await POST(req)
    const setCookie = res.headers.get('set-cookie')

    expect(setCookie).toContain('oauth_state=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toMatch(/SameSite=lax/i)
    expect(setCookie).toContain('Max-Age=300')
    expect(setCookie).toContain('Path=/')
  })

  it('state in URL matches state in cookie', async () => {
    const req = buildRequest('/api/auth/discord', { method: 'POST' })
    const res = await POST(req)
    const body = await res.json()
    const setCookie = res.headers.get('set-cookie')!

    const urlState = new URL(body.url).searchParams.get('state')
    const cookieState = setCookie.match(/oauth_state=([^;]+)/)?.[1]

    expect(urlState).toBeTruthy()
    expect(urlState).toBe(cookieState)
  })
})
