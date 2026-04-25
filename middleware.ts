import { NextRequest, NextResponse } from 'next/server';

type RateLimitRule = {
  path: RegExp
  methods: string[]
  limit: number
  windowMs: number
}

const rateLimitRules: RateLimitRule[] = [
  { path: /^\/api\/auth\/discord$/, methods: ['GET'], limit: 20, windowMs: 60_000 },
  { path: /^\/api\/auth\/callback\/discord$/, methods: ['GET'], limit: 20, windowMs: 60_000 },
  { path: /^\/api\/translate$/, methods: ['POST'], limit: 30, windowMs: 60_000 },
  { path: /^\/api\/i2v$/, methods: ['POST'], limit: 10, windowMs: 10 * 60_000 },
  { path: /^\/api\/admin\/logs\/ingest$/, methods: ['POST'], limit: 120, windowMs: 60_000 },
  { path: /^\/api\/comfyui\/proxy(\/.*)?$/, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], limit: 120, windowMs: 60_000 },
]

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' http: https: ws: wss:",
  "media-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ')

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return forwardedFor || realIp || 'local'
}

function getRateLimitRule(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  return rateLimitRules.find(rule => rule.methods.includes(request.method) && rule.path.test(pathname))
}

function checkRateLimit(request: NextRequest) {
  const rule = getRateLimitRule(request)
  if (!rule) return null

  const now = Date.now()
  const key = `${getClientKey(request)}:${request.method}:${request.nextUrl.pathname}`
  const bucket = rateLimitBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + rule.windowMs })
    return null
  }

  bucket.count += 1
  if (bucket.count <= rule.limit) return null

  return Math.ceil((bucket.resetAt - now) / 1000)
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Frame-Options', 'DENY')
  return response
}

export function resetRateLimitForTests() {
  rateLimitBuckets.clear()
}

export function middleware(request: NextRequest) {
  const retryAfter = checkRateLimit(request)
  if (retryAfter !== null) {
    return applySecurityHeaders(NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    ))
  }

  const sessionCookie = request.cookies.get('session_id');

  const newHeaders = new Headers(request.headers);
  
  if (sessionCookie) {
    newHeaders.set('x-session-id', sessionCookie.value);
  }

  const response = NextResponse.next({
    request: {
      headers: newHeaders,
    },
  });
  
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
