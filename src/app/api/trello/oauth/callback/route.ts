import { NextRequest, NextResponse } from 'next/server';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { TrelloClient } from '@/lib/trello';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');
    const state = searchParams.get('state');

    if (!oauthToken || !oauthVerifier || !state) {
      return NextResponse.json(
        { error: 'Missing OAuth parameters' },
        { status: 400 }
      );
    }

    // Decode state to get token secret
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const oauthTokenSecret = stateData.secret;

    const apiKey = process.env.TRELLO_API_KEY;
    const apiSecret = process.env.TRELLO_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Missing Trello configuration' },
        { status: 500 }
      );
    }

    const oauth = new OAuth({
      consumer: {
        key: apiKey,
        secret: apiSecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(baseString, key) {
        return crypto.createHmac('sha1', key).update(baseString).digest('base64');
      },
    });

    const requestData = {
      url: TrelloClient.getAccessTokenUrl(apiKey),
      method: 'POST',
    };

    const token = {
      key: oauthToken,
      secret: oauthTokenSecret,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    // Exchange for access token
    const response = await fetch(`${requestData.url}?oauth_verifier=${oauthVerifier}`, {
      method: 'POST',
      headers: {
        ...authHeader,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to obtain access token');
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Invalid access token response');
    }

    // Get member info
    const trelloClient = new TrelloClient({
      apiKey,
      apiSecret,
      token: accessToken,
    });

    const member = await trelloClient.request('GET', '/1/members/me');

    // Get shop context from session/cookie (simplified here)
    // In production, you'd get this from App Bridge session
    const shopDomain = request.cookies.get('shopify_shop')?.value;

    if (shopDomain) {
      const shop = await prisma.shop.findUnique({
        where: { domain: shopDomain },
      });

      if (shop) {
        // Store Trello connection
        await prisma.trelloConnection.upsert({
          where: { shopId: shop.id },
          create: {
            shopId: shop.id,
            trelloMemberId: member.id,
            token: accessToken,
            scope: process.env.TRELLO_DEFAULT_SCOPES || 'read,write',
            expiresAt: null, // never expires
          },
          update: {
            token: accessToken,
            trelloMemberId: member.id,
            scope: process.env.TRELLO_DEFAULT_SCOPES || 'read,write',
          },
        });

        await prisma.eventLog.create({
          data: {
            shopId: shop.id,
            source: 'trello',
            type: 'oauth_connected',
            payload: { memberId: member.id, memberName: member.fullName },
            status: 'success',
          },
        });
      }
    }

    // Redirect to success page
    const redirectUrl = new URL('/app/integrations/trello?success=true', process.env.SHOPIFY_APP_URL);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Trello OAuth callback error:', error);
    const redirectUrl = new URL('/app/integrations/trello?error=oauth_failed', process.env.SHOPIFY_APP_URL);
    return NextResponse.redirect(redirectUrl);
  }
}

