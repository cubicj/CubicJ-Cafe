import { NextRequest, NextResponse } from 'next/server'
// env removed - using process.env directly

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleProxy(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleProxy(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleProxy(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleProxy(request, path, 'DELETE')
}

async function handleProxy(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/')
    const comfyUrl = `${process.env.COMFYUI_API_URL || 'http://localhost:8188'}/${path}`
    
    const proxyHeaders = new Headers()
    
    // 필요한 헤더만 전달 (Origin, Host 등 민감한 정보 제외)
    // FormData의 경우 content-type을 설정하지 않아 브라우저가 자동으로 설정하도록 함
    const contentType = request.headers.get('content-type')
    if (contentType && !contentType.includes('multipart/form-data')) {
      proxyHeaders.set('content-type', contentType)
    }
    if (request.headers.get('authorization')) {
      proxyHeaders.set('authorization', request.headers.get('authorization')!)
    }

    let body: string | FormData | undefined
    if (method !== 'GET' && method !== 'DELETE') {
      // FormData인지 확인 (파일 업로드용)
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
      signal: AbortSignal.timeout(30000), // 30초 타임아웃
    })

    const responseData = await response.text()
    
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
    
  } catch {
    console.error('ComfyUI 프록시 오류: 백엔드 서버 연결 실패')
    
    return NextResponse.json({
      error: '백엔드 서비스 연결 실패',
      timestamp: new Date().toISOString()
    }, { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}