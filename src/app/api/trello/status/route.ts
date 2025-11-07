import { NextRequest, NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/session';
import { getTrelloMode, getTrelloConnectionForUser } from '@/lib/trello-connection';

/**
 * Check Trello connection status - Simple version
 */
export async function GET(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request);
    const mode = await getTrelloMode(shop.id);

    const connection = await getTrelloConnectionForUser(shop.id, user.id);

    const connected = Boolean(connection);
    const connectionScope = connection?.userId ? 'user' : 'shared';
    const canManage = mode === 'multi' || user.role === 'owner';

    return NextResponse.json({
      connected,
      connection: connected ? {
        memberId: connection!.trelloMemberId,
        token: connection!.token,
        scope: connectionScope,
      } : null,
      mode,
      canManage,
      user: {
        id: user.id,
        role: user.role,
        notify: user.notifyTrelloActivity,
      },
    });
  } catch (error: any) {
    console.error('Trello connection check error:', error);
    return NextResponse.json({ 
      connected: false,
      connection: null,
      error: error.message 
    });
  }
}

