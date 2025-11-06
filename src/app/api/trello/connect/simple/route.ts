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
    const shopCookie = request.cookies.get('shopify_shop')?.value;
    
    if (!shopCookie) {
      // Fallback: Use a default shop or create one
      // For development, we'll create a demo shop
      const demoShop = await prisma.shop.upsert({
        where: { domain: 'demo.myshopify.com' },
        create: {
          domain: 'demo.myshopify.com',
          status: 'active',
          plan: 'development',
        },
        update: {},
      });

      // Save connection
      await prisma.trelloConnection.upsert({
        where: { shopId: demoShop.id },
        create: {
          shopId: demoShop.id,
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
          shopId: demoShop.id,
          source: 'trello',
          type: 'manual_token_connected',
          payload: { memberId, memberName },
          status: 'success',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Trello connected successfully',
        member: { id: memberId, fullName: memberName },
      });
    }

    // Find shop by cookie
    const shop = await prisma.shop.findUnique({
      where: { domain: shopCookie },
    });

    if (!shop) {
      return NextResponse.json({ 
        error: 'Shop not found. Please install the app from Shopify first.' 
      }, { status: 404 });
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

    return NextResponse.json({
      success: true,
      message: 'Trello connected successfully',
      member: { id: memberId, fullName: memberName },
    });
  } catch (error: any) {
    console.error('Trello simple connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Connection failed' },
      { status: 500 }
    );
  }
}

