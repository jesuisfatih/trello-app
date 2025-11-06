import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, exchangeToken } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session token
    const payload = await validateSessionToken(sessionToken);
    
    if (!payload || !payload.dest) {
      return NextResponse.json(
        { error: 'Invalid session token payload' },
        { status: 401 }
      );
    }

    const shop = payload.dest.replace('https://', '');
    
    // Request body can specify token type
    const body = await request.json().catch(() => ({}));
    const requestedTokenType = body.requestedTokenType || 'online';

    // Exchange session token for access token
    const accessToken = await exchangeToken(shop, sessionToken, requestedTokenType);

    return NextResponse.json({
      accessToken,
      shop,
      expiresIn: requestedTokenType === 'online' ? 60 : null,
    });
  } catch (error: any) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: error.message || 'Token exchange failed' },
      { status: 500 }
    );
  }
}

