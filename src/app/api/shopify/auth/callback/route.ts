import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import prisma from '@/lib/db';
import crypto from 'crypto';

/**
 * Shopify OAuth callback
 * Completes OAuth flow and stores shop data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const hmac = searchParams.get('hmac');
    const host = searchParams.get('host') || searchParams.get('state');

    if (!shop || !code || !hmac) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify HMAC
    const params: any = {};
    searchParams.forEach((value, key) => {
      if (key !== 'hmac' && key !== 'signature') {
        params[key] = value;
      }
    });

    const message = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const calculatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
      .update(message)
      .digest('hex');

    if (calculatedHmac !== hmac) {
      return NextResponse.json(
        { error: 'Invalid HMAC signature' },
        { status: 401 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    // Get shop info using GraphQL
    const client = new shopify.clients.Graphql({
      domain: shop,
      accessToken,
    });

    const shopInfoResponse = await client.request(`
      query {
        shop {
          id
          name
          email
          myshopifyDomain
          plan {
            displayName
          }
        }
      }
    `);

    const shopInfo = shopInfoResponse.data?.shop;

    // Store or update shop in database
    const shopRecord = await prisma.shop.upsert({
      where: { domain: shop },
      create: {
        domain: shop,
        accessTokenOffline: accessToken,
        installedAt: new Date(),
        plan: shopInfo?.plan?.displayName || 'unknown',
        status: 'active',
      },
      update: {
        accessTokenOffline: accessToken,
        status: 'active',
        plan: shopInfo?.plan?.displayName || 'unknown',
      },
    });

    // Create default settings
    await prisma.settings.upsert({
      where: { shopId: shopRecord.id },
      create: {
        shopId: shopRecord.id,
        mappingOptions: {},
      },
      update: {},
    });

    // Log installation
    await prisma.eventLog.create({
      data: {
        shopId: shopRecord.id,
        source: 'shopify',
        type: 'app_installed',
        payload: {
          shop: shop,
          scope: scope,
          plan: shopInfo?.plan?.displayName,
        },
        status: 'success',
      },
    });

    // Redirect to app
    const redirectUrl = host
      ? `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`
      : `${process.env.SHOPIFY_APP_URL}/app`;

    const response = NextResponse.redirect(redirectUrl);
    
    // Set shop cookie for OAuth callback context
    response.cookies.set('shopify_shop', shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    
    const errorUrl = new URL('/app?error=auth_failed', process.env.SHOPIFY_APP_URL);
    return NextResponse.redirect(errorUrl);
  }
}

