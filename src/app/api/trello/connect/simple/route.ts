import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireSessionContext } from '@/lib/session';

/**
 * SIMPLE Trello connection - No Shopify session token required
 * Uses cookie-based shop identification
 */
export async function POST(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request);

    const body = await request.json();
    const { token, memberId, memberName } = body;

    if (!token || !memberId) {
      return NextResponse.json({ error: 'Token and memberId required' }, { status: 400 });
    }

    await prisma.trelloConnection.upsert({
      where: {
        shopId_userId: {
          shopId: shop.id,
          userId: user.id,
        },
      },
      create: {
        shopId: shop.id,
        userId: user.id,
        trelloMemberId: memberId,
        token,
        scope: 'read,write,account',
        expiresAt: null,
      },
      update: {
        token,
        trelloMemberId: memberId,
        scope: 'read,write,account',
      },
    });

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
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
