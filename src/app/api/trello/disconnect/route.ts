import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Disconnect Trello - Remove connection
 */
export async function POST(request: NextRequest) {
  try {
    const shopCookie = request.cookies.get('shopify_shop')?.value;
    
    if (!shopCookie) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shop = await prisma.shop.findUnique({
      where: { domain: shopCookie },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Delete Trello connection
    await prisma.trelloConnection.deleteMany({
      where: { shopId: shop.id },
    });

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        source: 'trello',
        type: 'disconnected',
        payload: {},
        status: 'success',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

