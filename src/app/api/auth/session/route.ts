import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withOptionalAuth(request, async (req) => {
    if (req.user) {
      return NextResponse.json({ 
        user: {
          id: req.user.id,
          discordId: req.user.discordId,
          discordUsername: req.user.discordUsername,
          nickname: req.user.nickname,
          avatar: req.user.avatar,
          name: req.user.discordUsername,
          image: req.user.avatar ? `https://cdn.discordapp.com/avatars/${req.user.discordId}/${req.user.avatar}.png` : null,
        }
      });
    }
    
    return NextResponse.json({ user: null });
  });
}