import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import prisma from '@/lib/db';

/**
 * Shopify OAuth entry point
 * Handles both initial install and re-auth
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const shop = searchParams.get('shop');
    const embedded = searchParams.get('embedded') || '1';
    const host = searchParams.get('host');

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!shop.endsWith('.myshopify.com')) {
      return NextResponse.json(
        { error: 'Invalid shop domain' },
        { status: 400 }
      );
    }

    // Build OAuth authorization URL
    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: '/api/shopify/auth/callback',
      isOnline: false, // Request offline token
    });

    // For embedded apps, use App Bridge redirect
    if (embedded === '1' && host) {
      const redirectUrl = `https://${shop}/admin/oauth/authorize?${new URLSearchParams({
        client_id: process.env.SHOPIFY_API_KEY!,
        scope: process.env.SHOPIFY_SCOPES || '',
        redirect_uri: `${process.env.SHOPIFY_APP_URL}/api/shopify/auth/callback`,
        state: host,
        'grant_options[]': 'offline',
      })}`;

      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(authRoute);
  } catch (error: any) {
    console.error('Shopify auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}

