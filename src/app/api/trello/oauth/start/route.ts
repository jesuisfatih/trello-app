import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/shopify';
import prisma from '@/lib/db';

/**
 * Atlassian OAuth 2.0 Start Handler
 * Initiates the OAuth 2.0 authorization code flow
 */
export async function GET(request: NextRequest) {
  try {
    // Get shop from session
    const authHeader = request.headers.get('authorization');
    let shopDomain: string | null = null;

    if (authHeader?.startsWith('Bearer ') && authHeader !== 'Bearer null') {
      try {
        const sessionToken = authHeader.substring(7);
        if (sessionToken && sessionToken !== 'null') {
          const payload = await validateSessionToken(sessionToken);
          shopDomain = payload.dest.replace('https://', '');
        }
      } catch (tokenError) {
        console.warn('Session token validation failed:', tokenError);
      }
    }

    // Fallback: Try to get shop from URL or cookies
    if (!shopDomain) {
      const urlParams = request.nextUrl.searchParams;
      const host = urlParams.get('host');
      
      // Try to decode host to get shop
      if (host) {
        try {
          const decodedHost = Buffer.from(host, 'base64').toString();
          const shopMatch = decodedHost.match(/([a-zA-Z0-9-]+\.myshopify\.com)/);
          if (shopMatch) {
            shopDomain = shopMatch[1];
          }
          if (!shopDomain) {
            const storeMatch = decodedHost.match(/store\/([a-zA-Z0-9-]+)/);
            if (storeMatch) {
              shopDomain = `${storeMatch[1]}.myshopify.com`;
            }
          }
        } catch (e) {
          // Host is not base64, try direct match
          const directMatch = host.match(/([a-zA-Z0-9-]+\.myshopify\.com)/);
          if (directMatch) {
            shopDomain = directMatch[1];
          }
          if (!shopDomain) {
            const storeMatch = host.match(/store\/([a-zA-Z0-9-]+)/);
            if (storeMatch) {
              shopDomain = `${storeMatch[1]}.myshopify.com`;
            }
          }
        }
      }
    }

    if (!shopDomain) {
      const explicitShop = request.nextUrl.searchParams.get('shop');
      if (explicitShop) {
        shopDomain = explicitShop;
      }
    }

    if (!shopDomain) {
      return NextResponse.json(
        { error: 'Unable to determine shop domain. Please ensure you are accessing this from Shopify admin.' },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { domain: shopDomain },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const clientId = process.env.TRELLO_CLIENT_ID || process.env.TRELLO_API_KEY;
    const redirectUri = `${process.env.SHOPIFY_APP_URL || 'https://trello-engine.com'}/api/trello/oauth/callback`;
    const scope = process.env.TRELLO_SCOPE || 'read:board write:board read:card write:card';

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing Trello OAuth configuration' },
        { status: 500 }
      );
    }

    // Create state parameter with shop domain
    const state = Buffer.from(
      JSON.stringify({
        shop: shopDomain,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Build authorization URL for Atlassian OAuth 2.0
    const authUrl = new URL('https://auth.atlassian.com/authorize');
    authUrl.searchParams.set('audience', 'api.atlassian.com');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('prompt', 'consent');

    return NextResponse.json({ authorizeUrl: authUrl.toString() });
  } catch (error: any) {
    console.error('Trello OAuth 2.0 start error:', error);
    return NextResponse.json(
      { error: error.message || 'OAuth initialization failed' },
      { status: 500 }
    );
  }
}
