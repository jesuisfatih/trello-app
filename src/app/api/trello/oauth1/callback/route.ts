import { NextRequest, NextResponse } from 'next/server'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import prisma from '@/lib/db'
import { getShopDomainFromRequest, setShopCookies } from '@/lib/shop'

const REQUEST_TOKEN_COOKIE = 'trello_oauth_request_token'
const REQUEST_SECRET_COOKIE = 'trello_oauth_request_secret'
const USER_COOKIE = 'trello_oauth_user'

const ACCESS_TOKEN_URL = 'https://trello.com/1/OAuthGetAccessToken'

function createOAuthClient(apiKey: string, apiSecret: string) {
  return new OAuth({
    consumer: {
      key: apiKey,
      secret: apiSecret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64')
    },
  })
}

function clearRequestCookies(response: NextResponse) {
  response.cookies.set(REQUEST_TOKEN_COOKIE, '', { path: '/', maxAge: 0 })
  response.cookies.set(REQUEST_SECRET_COOKIE, '', { path: '/', maxAge: 0 })
  response.cookies.set(USER_COOKIE, '', { path: '/', maxAge: 0 })
}

export async function GET(request: NextRequest) {
  const errorRedirect = (message: string) => {
    const redirectBase = process.env.SHOPIFY_APP_URL || 'https://trello-engine.dev'
    const url = new URL('/app/integrations/trello', redirectBase)
    url.searchParams.set('error', encodeURIComponent(message))
    return NextResponse.redirect(url)
  }

  try {
    const apiKey = process.env.TRELLO_API_KEY
    const apiSecret = process.env.TRELLO_API_SECRET

    if (!apiKey || !apiSecret) {
      return errorRedirect('Trello API credentials missing. Contact support.')
    }

    const searchParams = request.nextUrl.searchParams
    const oauthToken = searchParams.get('oauth_token')
    const oauthVerifier = searchParams.get('oauth_verifier')

    if (!oauthToken || !oauthVerifier) {
      return errorRedirect('Missing OAuth verifier from Trello.')
    }

    const tokenSecret = request.cookies.get(REQUEST_SECRET_COOKIE)?.value || ''
    const tokenCookie = request.cookies.get(REQUEST_TOKEN_COOKIE)?.value || ''

    if (!tokenSecret || !tokenCookie || tokenCookie !== oauthToken) {
      return errorRedirect('OAuth session expired. Please try connecting Trello again.')
    }

    // Determine shop context
    const cookieHost = request.cookies.get('shopify_host')?.value || null
    const cookieShop = request.cookies.get('shopify_shop')?.value || null
    const { shopDomain: shopFromRequest } = getShopDomainFromRequest({
      hostParam: cookieHost,
      shopParam: cookieShop,
    })

    const shopDomain = shopFromRequest || cookieShop

    if (!shopDomain) {
      return errorRedirect('Unable to identify Shopify shop during Trello OAuth.')
    }

    let shop = await prisma.shop.findUnique({
      where: { domain: shopDomain },
    })

    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          domain: shopDomain,
          status: 'active',
          plan: 'development',
        },
      })
    }

    const userId = request.cookies.get(USER_COOKIE)?.value

    if (!userId) {
      return errorRedirect('Unable to identify Shopify user during Trello OAuth. Please retry from the app.')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user || user.shopId !== shop.id) {
      return errorRedirect('Trello OAuth session user could not be verified. Please restart the connection.')
    }

    const oauth = createOAuthClient(apiKey, apiSecret)
    const scope = process.env.TRELLO_OAUTH1_SCOPE || 'read,write,account'

    const requestData = {
      url: ACCESS_TOKEN_URL,
      method: 'GET',
      data: {
        oauth_verifier: oauthVerifier,
      },
    }

    const authHeaders = oauth.toHeader(
      oauth.authorize(requestData, { key: oauthToken, secret: tokenSecret })
    ) as unknown as Record<string, string>

    const accessUrl = new URL(ACCESS_TOKEN_URL)
    accessUrl.searchParams.set('oauth_verifier', oauthVerifier)

    const trelloResponse = await fetch(accessUrl.toString(), {
      method: 'GET',
      headers: authHeaders,
    })

    const bodyText = await trelloResponse.text()

    if (!trelloResponse.ok) {
      console.error('Trello OAuth access token failed:', bodyText)
      return errorRedirect('Trello authorization failed. Please try again.')
    }

    const params = new URLSearchParams(bodyText)
    const accessToken = params.get('oauth_token')
    const accessTokenSecret = params.get('oauth_token_secret')

    if (!accessToken || !accessTokenSecret) {
      console.error('Trello OAuth access token invalid response:', bodyText)
      return errorRedirect('Invalid response from Trello during authorization.')
    }

    // Retrieve Trello member info using the access token
    const profileUrl = `https://api.trello.com/1/members/me?key=${encodeURIComponent(
      apiKey
    )}&token=${encodeURIComponent(accessToken)}`

    const profileResponse = await fetch(profileUrl)

    if (!profileResponse.ok) {
      const errText = await profileResponse.text()
      console.error('Failed to fetch Trello member profile:', errText)
      return errorRedirect('Unable to verify Trello account. Please try again.')
    }

    const member = await profileResponse.json()

    if (!member?.id) {
      return errorRedirect('Trello account details missing. Authorization cancelled.')
    }

    await prisma.trelloConnection.upsert({
      where: {
        shopId_userId: {
          shopId: shop.id,
          userId: user.id,
        },
      },
      create: {
        shopId: shop.id,
        userId: user.id,
        trelloMemberId: member.id,
        token: accessToken,
        scope,
        expiresAt: null,
      },
      update: {
        trelloMemberId: member.id,
        token: accessToken,
        scope,
        expiresAt: null,
      },
    })

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        userId: user.id,
        source: 'trello',
        type: 'oauth1_connected',
        payload: {
          memberId: member.id,
          memberName: member.fullName || member.username,
          userId: user.id,
        },
        status: 'success',
      },
    })

    const redirectBase = process.env.SHOPIFY_APP_URL || 'https://trello-engine.dev'
    const successUrl = new URL('/app/integrations/trello', redirectBase)
    successUrl.searchParams.set('success', 'oauth1')

    const response = NextResponse.redirect(successUrl)

    clearRequestCookies(response)
    setShopCookies(response, shop.domain, cookieHost)

    return response
  } catch (error: any) {
    console.error('Trello OAuth 1.0 callback error:', error)
    return errorRedirect('Trello authorization encountered an unexpected error.')
  }
}

