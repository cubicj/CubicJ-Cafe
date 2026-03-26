import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createLogger } from '@/lib/logger'

const log = createLogger('auth')

export async function POST(_request: NextRequest) {
  const state = randomUUID()

  const clientId = process.env.DISCORD_CLIENT_ID
  const redirectUri = `${process.env.APP_URL}/api/auth/callback/discord`

  const url = new URL('https://discord.com/api/oauth2/authorize')
  url.searchParams.set('client_id', clientId!)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'identify')
  url.searchParams.set('state', state)

  log.info('OAuth state token generated', { state: state.substring(0, 8) + '...' })

  const response = NextResponse.json({ url: url.toString() })

  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 300,
    path: '/',
  })

  return response
}
