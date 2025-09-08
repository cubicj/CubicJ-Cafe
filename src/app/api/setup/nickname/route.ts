import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/database/users';
import { withAuth } from '@/lib/auth/middleware';

// Node.js runtime 사용 (Edge Runtime이 아닌)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const data = await req.json();
      const nickname = data.nickname;
      
      // 닉네임 유효성 검사
      if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
        return NextResponse.json(
          { error: '닉네임은 2-20자 사이여야 합니다.' },
          { status: 400 }
        );
      }

      // 특수문자 검사 (한글, 영문, 숫자, 일부 기호만 허용)
      const nicknameRegex = /^[가-힣a-zA-Z0-9_\-\s]+$/;
      if (!nicknameRegex.test(nickname.trim())) {
        return NextResponse.json(
          { error: '닉네임에는 한글, 영문, 숫자, _, -, 공백만 사용할 수 있습니다.' },
          { status: 400 }
        );
      }

      // 닉네임 중복 확인
      const existingUser = await UserService.findByNickname(nickname.trim());
      if (existingUser && existingUser.discordId !== req.user!.discordId) {
        return NextResponse.json(
          { error: '이미 사용 중인 닉네임입니다.' },
          { status: 409 }
        );
      }

      // 사용자 닉네임 업데이트
      const updatedUser = await UserService.update(req.user!.discordId, {
        nickname: nickname.trim(),
      });

      return NextResponse.json({ 
        success: true, 
        user: updatedUser,
      });
    } catch (error) {
      console.error('Nickname setup error:', error);
      return NextResponse.json(
        { error: '닉네임 설정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

// 닉네임 중복 확인 API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nickname = searchParams.get('check');
    
    if (!nickname) {
      return NextResponse.json({ available: false });
    }

    const existingUser = await UserService.findByNickname(nickname);
    const isAvailable = !existingUser;
    
    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error('Nickname check error:', error);
    return NextResponse.json({ available: false });
  }
}