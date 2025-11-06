import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/shopify'
import prisma from '@/lib/db'
import { extractShopFromHost, getShopDomainFromRequest } from '@/lib/shop'

/**
 * Atlassian OAuth 2.0 Start Handler
 * Initiates the OAuth 2.0 authorization code flow
 */
export async function GET(request: NextRequest) {
  try {
    const hostQueryParam = request.nextUrl.searchParams.get('host')
    const shopQueryParam = request.nextUrl.searchParams.get('shop')
    const cookieHost = request.cookies.get('shopify_host')?.value || null
    const cookieShop = request.cookies.get('shopify_shop')?.value || null

    let hostValue = hostQueryParam || cookieHost
    let shopDomain: string | null = null

    // Get shop from session token if available
    const authHeader = request.headers.get('authorization')

    if (authHeader?.startsWith('Bearer ') && authHeader !== 'Bearer null') {
      try {
        const sessionToken = authHeader.substring(7)
        if (sessionToken && sessionToken !== 'null') {
          const payload = await validateSessionToken(sessionToken)
          shopDomain = payload.dest.replace('https://', '')
        }
      } catch (tokenError) {
        console.warn('Session token validation failed:', tokenError)
      }
    }

    // Fallback: Try to get shop from URL, cookies, or host
    if (!shopDomain) {
      const { shopDomain: inferredShop } = getShopDomainFromRequest({
        hostParam: hostQueryParam || cookieHost,
        shopParam: shopQueryParam || cookieShop,
      })
      shopDomain = inferredShop
    }

    if (!shopDomain) {
      const shopFromHost = extractShopFromHost(hostValue || '')
      if (shopFromHost) {
        shopDomain = shopFromHost
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
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const clientId = process.env.TRELLO_CLIENT_ID || process.env.TRELLO_API_KEY
    const redirectUri = `${process.env.SHOPIFY_APP_URL || 'https://trello-engine.dev'}/api/trello/oauth/callback`
    const scope = process.env.TRELLO_SCOPE || 'read:board write:board read:card write:card'

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing Trello OAuth configuration' },
        { status: 500 }
      )
    }

    // Create state parameter with shop domain
    const state = Buffer.from(
      JSON.stringify({
        shop: shopDomain,
        timestamp: Date.now(),
      })
    ).toString('base64')

    // Build authorization URL for Atlassian OAuth 2.0
    const authUrl = new URL('https://auth.atlassian.com/authorize')
    authUrl.searchParams.set('audience', 'api.atlassian.com')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('prompt', 'consent')

    const response = NextResponse.json({ authorizeUrl: authUrl.toString() })

    if (hostValue) {
      response.cookies.set('shopify_host', hostValue, {
        httpOnly: false,
        secure: request.nextUrl.protocol === 'https:',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
    }

    response.cookies.set('shopify_shop', shopDomain, {
      httpOnly: false,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Trello OAuth 2.0 start error:', error)
    return NextResponse.json(
      { error: error.message || 'OAuth initialization failed' },
      { status: 500 }
    )
  }
}
