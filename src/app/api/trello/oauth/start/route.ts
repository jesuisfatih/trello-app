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
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    const payload = await validateSessionToken(sessionToken);
    const shopDomain = payload.dest.replace('https://', '');

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
