import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/database/sessions';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.discordId) {
      return NextResponse.json({ isAdmin: false });
    }

    const adminStatus = isAdmin(session.user.discordId);
    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}