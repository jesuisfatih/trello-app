import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Get event logs
 */
export async function GET(request: NextRequest) {
  try {
    // Get shop from cookie
    const shopCookie = request.cookies.get('shopify_shop')?.value;
    
    if (!shopCookie) {
      return NextResponse.json({ logs: [] });
    }

    const shop = await prisma.shop.findUnique({
      where: { domain: shopCookie },
    });

    if (!shop) {
      return NextResponse.json({ logs: [] });
    }

    // Get logs for this shop
    const logs = await prisma.eventLog.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Logs fetch error:', error);
    return NextResponse.json({ logs: [], error: error.message });
  }
}

