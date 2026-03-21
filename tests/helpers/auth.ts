import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { SessionService } from '@/lib/database/sessions'

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export async function createTestSession(userId: number) {
  const session = await SessionService.create(userId, SESSION_DURATION_MS)
  if (!session) throw new Error('Failed to create test session')
  return session
}

export async function createExpiredSession(userId: number) {
  const session = await SessionService.create(userId, 1)
  if (!session) throw new Error('Failed to create expired test session')
  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  })
  return session
}

export function buildRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

export function buildAuthenticatedRequest(
  url: string,
  sessionId: string,
  options?: RequestInit
): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    ...options,
    headers: {
      ...((options?.headers as Record<string, string>) || {}),
      cookie: `session_id=${sessionId}`,
    },
  })
}
