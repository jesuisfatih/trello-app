import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * SIMPLE Trello connection - No Shopify session token required
 * Uses cookie-based shop identification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, memberId, memberName } = body;

    if (!token || !memberId) {
      return NextResponse.json({ error: 'Token and memberId required' }, { status: 400 });
    }

    // Get shop from cookie (set during Shopify OAuth install)
    let shopCookie = request.cookies.get('shopify_shop')?.value;
    let shop;

    if (!shopCookie) {
      // Fallback: Use a default shop or create one
      // For development, we'll create a demo shop
      shop = await prisma.shop.upsert({
        where: { domain: 'demo.myshopify.com' },
        create: {
          domain: 'demo.myshopify.com',
          status: 'active',
          plan: 'development',
        },
        update: {},
      });
    } else {
      const normalizedShop = shopCookie.toLowerCase();

      shop = await prisma.shop.upsert({
        where: { domain: normalizedShop },
        create: {
          domain: normalizedShop,
          status: 'active',
          plan: 'development',
        },
        update: {},
      });
    }

    // Save connection
    await prisma.trelloConnection.upsert({
      where: { shopId: shop.id },
      create: {
        shopId: shop.id,
        trelloMemberId: memberId,
        token: token,
        scope: 'read,write',
        expiresAt: null,
      },
      update: {
        token: token,
        trelloMemberId: memberId,
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
