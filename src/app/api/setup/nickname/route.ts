import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/database/users';
import { withAuth } from '@/lib/auth/middleware';
import { parseBody, parseQuery } from '@/lib/validations/parse';
import { createNicknameSchema, checkNicknameQuerySchema } from '@/lib/validations/schemas/nickname';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      let data;
      try {
        data = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
      const result = parseBody(createNicknameSchema, data);
      if (!result.success) return result.response;
      const { nickname } = result.data;

      const existingUser = await UserService.findByNickname(nickname);
      if (existingUser && existingUser.discordId !== req.user!.discordId) {
        return NextResponse.json(
          { error: '이미 사용 중인 닉네임입니다.' },
          { status: 409 }
        );
      }

      const updatedUser = await UserService.update(req.user!.discordId, {
        nickname: nickname,
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      log.error('Nickname setup error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: '닉네임 설정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const result = parseQuery(checkNicknameQuerySchema, request.nextUrl.searchParams);
    if (!result.success) return result.response;
    const { check: nickname } = result.data;

    if (!nickname) {
      return NextResponse.json({ available: false });
    }

    const existingUser = await UserService.findByNickname(nickname);
    const isAvailable = !existingUser;

    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    log.error('Nickname check error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ available: false });
  }
}
