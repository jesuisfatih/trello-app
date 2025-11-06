import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/shopify';
import prisma from '@/lib/db';

/**
 * Atlassian OAuth 2.0 Callback Handler
 * This handles the OAuth 2.0 authorization code flow for Atlassian/Trello
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const redirectUrl = new URL(
        '/app/integrations/trello?error=oauth_failed',
        process.env.SHOPIFY_APP_URL || 'https://trello-engine.com'
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    // Decode state to get shop domain
    let shopDomain: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      shopDomain = stateData.shop;
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Get shop from database
    const shop = await prisma.shop.findUnique({
      where: { domain: shopDomain },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Exchange authorization code for access token
    const clientId = process.env.TRELLO_CLIENT_ID || process.env.TRELLO_API_KEY;
    const clientSecret = process.env.TRELLO_CLIENT_SECRET || process.env.TRELLO_API_SECRET;
    const redirectUri = `${process.env.SHOPIFY_APP_URL || 'https://trello-engine.com'}/api/trello/oauth/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Trello OAuth configuration' },
        { status: 500 }
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    // Get user info from Atlassian
    const userResponse = await fetch('https://api.atlassian.com/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userResponse.json();

    // Calculate expiration date
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    // Store Trello connection
    await prisma.trelloConnection.upsert({
      where: { shopId: shop.id },
      create: {
        shopId: shop.id,
        trelloMemberId: userInfo.account_id || userInfo.email,
        token: accessToken,
        refreshToken: refreshToken,
        scope: tokenData.scope || 'read,write',
        expiresAt: expiresAt,
      },
      update: {
        token: accessToken,
        refreshToken: refreshToken,
        trelloMemberId: userInfo.account_id || userInfo.email,
        scope: tokenData.scope || 'read,write',
        expiresAt: expiresAt,
      },
    });

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        source: 'trello',
        type: 'oauth_connected',
        payload: {
          memberId: userInfo.account_id,
          memberName: userInfo.name || userInfo.email,
        },
        status: 'success',
      },
    });

    // Redirect to success page
    const redirectUrl = new URL(
      '/app/integrations/trello?success=true',
      process.env.SHOPIFY_APP_URL || 'https://trello-engine.com'
    );
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Trello OAuth 2.0 callback error:', error);
    const redirectUrl = new URL(
      '/app/integrations/trello?error=oauth_failed',
      process.env.SHOPIFY_APP_URL || 'https://trello-engine.com'
    );
    return NextResponse.redirect(redirectUrl);
  }
}
