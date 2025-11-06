import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/shopify';
import prisma from '@/lib/db';

/**
 * Verify session token and return shop/user info
 * Used for client-side session validation
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header', authenticated: false },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate token
    const payload = await validateSessionToken(sessionToken);
    
    if (!payload || !payload.dest) {
      return NextResponse.json(
        { error: 'Invalid session token', authenticated: false },
        { status: 401 }
      );
    }

    const shop = payload.dest.replace('https://', '');
    
    // Get shop from database
    const shopRecord = await prisma.shop.findUnique({
      where: { domain: shop },
      include: {
        trelloConnections: true,
        settings: true,
      },
    });

    if (!shopRecord) {
      return NextResponse.json(
        { error: 'Shop not found', authenticated: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      shop: {
        id: shopRecord.id,
        domain: shopRecord.domain,
        plan: shopRecord.plan,
        status: shopRecord.status,
      },
      trelloConnected: shopRecord.trelloConnections.length > 0,
      user: {
        sub: payload.sub,
        aud: payload.aud,
      },
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed', authenticated: false },
      { status: 500 }
    );
  }
}

