import { createRouteHandler, AuthenticatedRequest } from '@/lib/api/route-handler';
import { isAdmin } from '@/lib/auth/admin';

export const GET = createRouteHandler(
  { auth: 'optional' },
  async (req: AuthenticatedRequest) => {
    if (req.user) {
      return {
        user: {
          id: req.user.id,
          discordId: req.user.discordId,
          discordUsername: req.user.discordUsername,
          nickname: req.user.nickname,
          avatar: req.user.avatar,
          name: req.user.discordUsername,
          image: req.user.avatar ? `https://cdn.discordapp.com/avatars/${req.user.discordId}/${req.user.avatar}.png` : null,
        },
        isAdmin: isAdmin(req.user.discordId),
      };
    }

    return { user: null, isAdmin: false };
  }
);
