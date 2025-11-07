import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireSessionContext } from '@/lib/session';
import { getTrelloMode } from '@/lib/trello-connection';

/**
 * SIMPLE Trello connection - No Shopify session token required
 * Uses cookie-based shop identification
 */
export async function POST(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request);
    const mode = await getTrelloMode(shop.id);

    if (mode === 'single' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Only the store owner can manage the shared Trello connection.' }, { status: 403 });
    }

    const body = await request.json();
    const { token, memberId, memberName } = body;

    if (!token || !memberId) {
      return NextResponse.json({ error: 'Token and memberId required' }, { status: 400 });
    }

    const targetUserId = mode === 'single' ? null : user.id;

    const existing = await prisma.trelloConnection.findFirst({
      where: {
        shopId: shop.id,
        userId: targetUserId,
      },
    })

    if (existing) {
      await prisma.trelloConnection.update({
        where: { id: existing.id },
        data: {
          token,
          trelloMemberId: memberId,
          scope: 'read,write,account',
        },
      })
    } else {
      await prisma.trelloConnection.create({
        data: {
          shopId: shop.id,
          userId: targetUserId,
          trelloMemberId: memberId,
          token,
          scope: 'read,write,account',
          expiresAt: null,
        },
      })
    }

    if (mode === 'single') {
      await prisma.trelloConnection.deleteMany({
        where: {
          shopId: shop.id,
          userId: { not: null },
        },
      });
    }

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        userId: user.id,
        source: 'trello',
        type: 'manual_token_connected',
        payload: { memberId, memberName },
        status: 'success',
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Trello connected successfully',
      member: { id: memberId, fullName: memberName },
    });

    // Set cookie to remember shop (for cross-page persistence)
    response.cookies.set('shopify_shop', shop.domain, {
      httpOnly: false, // Frontend'den okunabilir olmalı
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Trello simple connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Connection failed' },
      { status: 500 }
    );
  }
}
