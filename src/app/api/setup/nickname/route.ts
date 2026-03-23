import { NextResponse } from 'next/server';
import { UserService } from '@/lib/database/users';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseBody, parseQuery } from '@/lib/validations/parse';
import { createNicknameSchema, checkNicknameQuerySchema } from '@/lib/validations/schemas/nickname';

export const runtime = 'nodejs';

export const POST = createRouteHandler(
  { auth: 'user' },
  async (req) => {
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

    return { user: updatedUser };
  }
);

export const GET = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    const result = parseQuery(checkNicknameQuerySchema, req.nextUrl.searchParams);
    if (!result.success) return result.response;
    const { check: nickname } = result.data;

    if (!nickname) {
      return { available: false };
    }

    try {
      const existingUser = await UserService.findByNickname(nickname);
      const isAvailable = !existingUser;
      return { available: isAvailable };
    } catch {
      return { available: false };
    }
  }
);
