import { NextResponse } from 'next/server';
import { UserService } from '@/lib/database/users';
import { sessionManager } from '@/lib/auth/session';
import { createRouteHandler } from '@/lib/api/route-handler';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth');

export const GET = createRouteHandler(
  { auth: 'none', category: 'auth' },
  async (req) => {
    log.info('Discord callback called', {
      url: req.url,
      origin: req.nextUrl.origin,
      searchParams: Object.fromEntries(req.nextUrl.searchParams.entries()),
    });

    const searchParams = req.nextUrl.searchParams;
    const error = searchParams.get('error');
    const code = searchParams.get('code');

    log.info('Discord callback params', {
      error,
      code: code ? code.substring(0, 10) + '...' : null,
    });

    if (error === 'access_denied' || error) {
      log.info('Discord OAuth cancelled or error', { error });
      const baseUrl = process.env.APP_URL || req.nextUrl.origin;
      return NextResponse.redirect(new URL('/', baseUrl));
    }

    const state = searchParams.get('state');
    const cookieState = req.cookies.get('oauth_state')?.value;

    if (!state || !cookieState || state !== cookieState) {
      log.warn('OAuth state validation failed', {
        hasState: !!state,
        hasCookie: !!cookieState,
        match: state === cookieState,
      });
      const baseUrl = process.env.APP_URL || req.nextUrl.origin;
      const response = NextResponse.redirect(new URL('/', baseUrl));
      response.cookies.delete('oauth_state');
      return response;
    }

    if (code) {
      try {
        log.info('Starting token exchange with Discord');

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
              redirect_uri: `${process.env.APP_URL}/api/auth/callback/discord`,
            }),
          });
        } catch (fetchError) {
          log.error('Network error during token exchange', {
            error:
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError),
          });
          throw new Error('Network error during token exchange');
        }

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          log.error('Token exchange failed', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            response: errorText,
          });
          throw new Error('Token exchange failed');
        }

        const tokens = await tokenResponse.json();

        log.info('Token exchange successful, fetching user info');

        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('User info fetch failed');
        }

        const discordUser = await userResponse.json();

        log.info('User info fetched', { username: discordUser.username });

        const existingUser = await UserService.findByDiscordId(discordUser.id);

        let redirectUrl = '/';
        let sessionData;

        if (existingUser) {
          await UserService.update(existingUser.discordId, {
            discordUsername: discordUser.username,
            avatar: discordUser.avatar,
          });

          sessionData = await sessionManager.createSession(discordUser.id);

          if (!existingUser.nickname) {
            redirectUrl = '/initial-setup/nickname';
          }

          log.info('Existing user login', { nickname: existingUser.nickname });
        } else {
          await UserService.create({
            discordId: discordUser.id,
            discordUsername: discordUser.username,
            nickname: '',
            avatar: discordUser.avatar,
          });

          sessionData = await sessionManager.createSession(discordUser.id);
          redirectUrl = '/initial-setup/nickname';
          log.info('New user registration required', {
            username: discordUser.username,
          });
        }

        const baseUrl = process.env.APP_URL || req.nextUrl.origin;
        const response = NextResponse.redirect(new URL(redirectUrl, baseUrl));

        log.info('Setting session cookie', {
          sessionId: sessionData.sessionId.substring(0, 8) + '...',
          expires: sessionData.expiresAt,
          secure: (process.env.NODE_ENV || 'development') === 'production',
          nodeEnv: process.env.NODE_ENV || 'development',
          origin: req.nextUrl.origin,
          redirectUrl,
          baseUrl,
        });

        const result = sessionManager.setSessionCookie(
          response,
          sessionData.sessionId,
          sessionData.expiresAt
        );
        result.cookies.delete('oauth_state');
        return result;
      } catch (error) {
        log.error('Discord OAuth error', {
          error: error instanceof Error ? error.message : String(error),
        });
        const baseUrl = process.env.APP_URL || req.nextUrl.origin;
        return NextResponse.redirect(new URL('/', baseUrl));
      }
    }

    const baseUrl = process.env.APP_URL || req.nextUrl.origin;
    return NextResponse.redirect(new URL('/', baseUrl));
  }
);
