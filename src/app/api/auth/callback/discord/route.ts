import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/database/users';
import { sessionManager } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  // 전체 함수를 try-catch로 감싸서 모든 오류 캐치
  try {
    // 파일에 로그 작성 (PM2 로그가 안 보일 경우를 대비)
    try {
      const fs = await import('fs');
      const logMessage = `[${new Date().toISOString()}] Discord callback called: ${request.url}\n`;
      fs.appendFileSync('/tmp/discord-callback.log', logMessage);
    } catch {
      // 파일 쓰기 실패 시 무시
    }

    // 파일에 추가 로그 작성 (console.log는 프로덕션에서 제거됨)
    try {
      const fs = await import('fs');
      const debugMessage = `[${new Date().toISOString()}] 🔥 Discord callback started successfully\n`;
      fs.appendFileSync('/tmp/discord-callback.log', debugMessage);
    } catch {}
    
    console.log('🔥 Discord callback called!', {
      url: request.url,
      origin: request.nextUrl.origin,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries())
    });

  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  const code = searchParams.get('code');

  // 파일에 파라미터 로그 작성
  try {
    const fs = await import('fs');
    const paramsMessage = `[${new Date().toISOString()}] 🔍 Discord callback params - error: ${error}, code: ${code ? code.substring(0, 10) + '...' : 'null'}\n`;
    fs.appendFileSync('/tmp/discord-callback.log', paramsMessage);
  } catch {}
  
  console.log('🔍 Discord callback params:', { error, code: code ? code.substring(0, 10) + '...' : null });

  // Discord OAuth에서 취소하거나 에러가 발생한 경우
  if (error === 'access_denied' || error) {
    console.log('❌ Discord OAuth cancelled or error:', error);
    // 홈페이지로 리다이렉트
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    return NextResponse.redirect(new URL('/', baseUrl));
  }

  // 정상적인 인증 코드가 있는 경우
  if (code) {
    try {
      // 파일에 토큰 교환 시작 로그 작성
      try {
        const fs = await import('fs');
        const tokenStartMessage = `[${new Date().toISOString()}] 🔄 Starting token exchange with Discord\n`;
        fs.appendFileSync('/tmp/discord-callback.log', tokenStartMessage);
      } catch {}
      
      // Discord API로 토큰 교환
      let tokenResponse;
      try {
        tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`,
          }),
        });
      } catch (fetchError) {
        // 파일에 네트워크 오류 로그 작성
        try {
          const fs = await import('fs');
          const networkErrorMessage = `[${new Date().toISOString()}] 🌐 Network error during token exchange: ${fetchError}\n`;
          fs.appendFileSync('/tmp/discord-callback.log', networkErrorMessage);
        } catch {}
        throw new Error('Network error during token exchange');
      }

      if (!tokenResponse.ok) {
        // 파일에 토큰 교환 실패 로그 작성
        const errorText = await tokenResponse.text();
        console.error('🚨 Discord token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          response: errorText
        });
        try {
          const fs = await import('fs');
          const tokenErrorMessage = `[${new Date().toISOString()}] ❌ Token exchange failed - Status: ${tokenResponse.status}, Response: ${errorText}\n`;
          fs.appendFileSync('/tmp/discord-callback.log', tokenErrorMessage);
        } catch {}
        throw new Error('Token exchange failed');
      }

      const tokens = await tokenResponse.json();

      // 파일에 토큰 교환 성공 로그 작성
      try {
        const fs = await import('fs');
        const tokenSuccessMessage = `[${new Date().toISOString()}] ✅ Token exchange successful, fetching user info\n`;
        fs.appendFileSync('/tmp/discord-callback.log', tokenSuccessMessage);
      } catch {}

      // Discord API로 사용자 정보 가져오기
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('User info fetch failed');
      }

      const discordUser = await userResponse.json();

      // 파일에 사용자 정보 가져오기 성공 로그 작성
      try {
        const fs = await import('fs');
        const userInfoMessage = `[${new Date().toISOString()}] 👤 User info fetched: ${discordUser.username}, checking database\n`;
        fs.appendFileSync('/tmp/discord-callback.log', userInfoMessage);
      } catch {}

      // 기존 사용자 확인
      const existingUser = await UserService.findByDiscordId(discordUser.id);
      
      let redirectUrl = '/';
      let sessionData;

      if (existingUser) {
        // 기존 사용자: 사용자 정보 업데이트 후 세션 생성
        await UserService.update(existingUser.discordId, {
          discordUsername: discordUser.username,
          avatar: discordUser.avatar,
        });
        
        sessionData = await sessionManager.createSession(discordUser.id);
        
        // 닉네임이 없는 기존 사용자도 닉네임 설정 페이지로
        if (!existingUser.nickname) {
          redirectUrl = '/initial-setup/nickname';
        }
        
        console.log('Existing user login:', existingUser.nickname);
      } else {
        // 신규 사용자: 임시 사용자 생성 후 닉네임 설정 페이지로
        await UserService.create({
          discordId: discordUser.id,
          discordUsername: discordUser.username,
          nickname: '', // 빈 닉네임 = 미설정 상태
          avatar: discordUser.avatar,
        });
        
        sessionData = await sessionManager.createSession(discordUser.id);
        redirectUrl = '/initial-setup/nickname';
        console.log('New user registration required:', discordUser.username);
      }

      // HttpOnly 쿠키 설정하고 HTTP 302 리다이렉트
      const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
      const response = NextResponse.redirect(new URL(redirectUrl, baseUrl));
      
      // 파일에 쿠키 설정 로그 작성
      try {
        const fs = await import('fs');
        const cookieMessage = `[${new Date().toISOString()}] 🍪 Setting session cookie - sessionId: ${sessionData.sessionId.substring(0, 8)}..., secure: ${(process.env.NODE_ENV || 'development') === 'production'}, nodeEnv: ${process.env.NODE_ENV || 'development'}, redirectUrl: ${redirectUrl}\n`;
        fs.appendFileSync('/tmp/discord-callback.log', cookieMessage);
      } catch {}
      
      console.log('🍪 Setting session cookie:', {
        sessionId: sessionData.sessionId.substring(0, 8) + '...',
        expires: sessionData.expiresAt,
        secure: (process.env.NODE_ENV || 'development') === 'production',
        nodeEnv: process.env.NODE_ENV || 'development',
        origin: request.nextUrl.origin,
        redirectUrl: redirectUrl,
        baseUrl: baseUrl
      });
      
      return sessionManager.setSessionCookie(response, sessionData.sessionId, sessionData.expiresAt);
    } catch (error) {
      console.error('Discord OAuth error:', error);
      // 에러 발생 시 홈페이지로 리다이렉트
      const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
      return NextResponse.redirect(new URL('/', baseUrl));
    }
  }

  // code도 error도 없는 경우 홈페이지로 리다이렉트
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  return NextResponse.redirect(new URL('/', baseUrl));
  
  } catch (globalError) {
    // 전체 함수에서 발생한 모든 오류를 캐치
    console.error('🚨 Critical error in Discord callback:', globalError);
    try {
      const fs = await import('fs');
      const errorMessage = `[${new Date().toISOString()}] CRITICAL ERROR: ${globalError}\n`;
      fs.appendFileSync('/tmp/discord-callback-error.log', errorMessage);
    } catch {
      // 파일 쓰기 실패해도 계속 진행
    }
    
    // 오류 발생 시 홈페이지로 리다이렉트
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/', baseUrl));
  }
}