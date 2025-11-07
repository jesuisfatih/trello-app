import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireSessionContext } from '@/lib/session';

/**
 * Check Trello connection status - Simple version
 */
export async function GET(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request);

    let connection = await prisma.trelloConnection.findFirst({
      where: {
        shopId: shop.id,
        userId: user.id,
      },
    });

    if (!connection) {
      connection = await prisma.trelloConnection.findFirst({
        where: {
          shopId: shop.id,
          userId: null,
        },
      });
    }

    const connected = Boolean(connection);

    return NextResponse.json({
      connected,
      connection: connected
        ? {
            memberId: connection!.trelloMemberId,
            token: connection!.token,
          }
        : null,
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

