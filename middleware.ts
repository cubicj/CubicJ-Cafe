import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_id');

  const newHeaders = new Headers(request.headers);
  
  // 세션 쿠키가 있으면 별도 헤더로 전달 (Next.js cookies() 함수 제한 우회)
  if (sessionCookie) {
    newHeaders.set('x-session-id', sessionCookie.value);
  }

  const response = NextResponse.next({
    request: {
      headers: newHeaders,
    },
  });
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};