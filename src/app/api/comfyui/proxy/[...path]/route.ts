import { NextRequest, NextResponse } from 'next/server'

import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { createRouteHandler, AuthenticatedRequest } from '@/lib/api/route-handler';

const log = createLogger('comfyui');

const ALLOWED_PATH_PREFIXES = [
  'system_stats',
  'object_info',
  'prompt',
  'queue',
  'history',
  'view',
  'upload/image',
  'embeddings',
  'extensions',
]

function isPathAllowed(pathSegments: string[]): boolean {
  const path = pathSegments.join('/')
  return ALLOWED_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
}

export const GET = createRouteHandler(
  { auth: 'admin', category: 'comfyui' },
  async (request: NextRequest, { params }: { params: { path: string[] } }) => {
    return handleProxy(request, params.path, 'GET')
  }
)

export const POST = createRouteHandler(
  { auth: 'admin', category: 'comfyui' },
  async (request: NextRequest, { params }: { params: { path: string[] } }) => {
    return handleProxy(request, params.path, 'POST')
  }
)

export const PUT = createRouteHandler(
  { auth: 'admin', category: 'comfyui' },
  async (request: NextRequest, { params }: { params: { path: string[] } }) => {
    return handleProxy(request, params.path, 'PUT')
  }
)

export const DELETE = createRouteHandler(
  { auth: 'admin', category: 'comfyui' },
  async (request: NextRequest, { params }: { params: { path: string[] } }) => {
    return handleProxy(request, params.path, 'DELETE')
  }
)

async function handleProxy(
  request: AuthenticatedRequest,
  pathSegments: string[],
  method: string
) {
  try {
    if (!isComfyUIEnabled()) {
      return NextResponse.json(
        { error: 'ComfyUI 서버가 비활성 상태입니다.' },
        { status: 503 }
      );
    }

    if (!isPathAllowed(pathSegments)) {
      log.warn('Blocked proxy request to disallowed path', { path: pathSegments.join('/') })
      return NextResponse.json(
        { error: '허용되지 않은 경로입니다.' },
        { status: 403 }
      );
    }

    const path = pathSegments.join('/')
    const comfyUrl = `${process.env.COMFYUI_API_URL || 'http://localhost:8188'}/${path}`

    const proxyHeaders = new Headers()

    const contentType = request.headers.get('content-type')
    if (contentType && !contentType.includes('multipart/form-data')) {
      proxyHeaders.set('content-type', contentType)
    }
    if (request.headers.get('authorization')) {
      proxyHeaders.set('authorization', request.headers.get('authorization')!)
    }

    let body: string | FormData | undefined
    if (method !== 'GET' && method !== 'DELETE') {
      if (contentType?.includes('multipart/form-data')) {
        body = await request.formData()
      } else {
        body = await request.text()
      }
    }

    const response = await fetch(comfyUrl, {
      method,
      headers: proxyHeaders,
      body,
      signal: AbortSignal.timeout(30000),
    })

    const responseData = await response.text()

    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })

  } catch {
    log.error('ComfyUI proxy error: backend server connection failed')

    return NextResponse.json({
      error: '백엔드 서비스 연결 실패',
    }, {
      status: 503,
    })
  }
}