import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Check Trello connection status - Simple version
 */
export async function GET(request: NextRequest) {
  try {
    // Get shop from cookie
    const shopCookie = request.cookies.get('shopify_shop')?.value;
    
    if (!shopCookie) {
      // No cookie - return not connected
      return NextResponse.json({ 
        connected: false,
        connection: null 
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { domain: shopCookie },
      include: { trelloConnections: true },
    });

    if (!shop) {
      return NextResponse.json({ 
        connected: false,
        connection: null 
      });
    }

    const connected = shop.trelloConnections.length > 0;

    return NextResponse.json({
      connected,
      connection: connected ? {
        memberId: shop.trelloConnections[0].trelloMemberId,
        token: shop.trelloConnections[0].token,
      } : null,
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

