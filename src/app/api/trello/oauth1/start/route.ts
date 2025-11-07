import { NextRequest, NextResponse } from 'next/server'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import { requireSessionContext } from '@/lib/session'

const REQUEST_TOKEN_COOKIE = 'trello_oauth_request_token'
const REQUEST_SECRET_COOKIE = 'trello_oauth_request_secret'
const USER_COOKIE = 'trello_oauth_user'
const APP_NAME = 'SEO DROME TEAM'

const OAUTH_REQUEST_URL = 'https://trello.com/1/OAuthGetRequestToken'
const AUTHORIZE_URL = 'https://trello.com/1/OAuthAuthorizeToken'

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

export async function GET(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)

    const apiKey = process.env.TRELLO_API_KEY
    const apiSecret = process.env.TRELLO_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Trello API credentials are not configured. Please set TRELLO_API_KEY and TRELLO_API_SECRET.' },
        { status: 500 }
      )
    }

    const callbackBase = process.env.SHOPIFY_APP_URL || 'https://trello-engine.dev'
    const callbackUrl = `${callbackBase}/api/trello/oauth1/callback`

    const scope = process.env.TRELLO_OAUTH1_SCOPE || 'read,write,account'
    const expiration = process.env.TRELLO_OAUTH1_EXPIRATION || 'never'

    const oauth = createOAuthClient(apiKey, apiSecret)

    const requestUrl = new URL(OAUTH_REQUEST_URL)
    requestUrl.searchParams.set('scope', scope)
    requestUrl.searchParams.set('expiration', expiration)
    requestUrl.searchParams.set('name', APP_NAME)
    requestUrl.searchParams.set('oauth_callback', callbackUrl)

    const requestData = {
      url: requestUrl.toString(),
      method: 'GET',
    }

    const headers = oauth.toHeader(oauth.authorize(requestData)) as unknown as Record<string, string>

    const trelloResponse = await fetch(requestData.url, {
      method: 'GET',
      headers,
    })

    const bodyText = await trelloResponse.text()

    if (!trelloResponse.ok) {
      console.error('Trello OAuth request token failed:', bodyText)
      return NextResponse.json(
        { error: 'Failed to initiate Trello OAuth. Please try again later.' },
        { status: 502 }
      )
    }

    const params = new URLSearchParams(bodyText)
    const oauthToken = params.get('oauth_token')
    const oauthTokenSecret = params.get('oauth_token_secret')

    if (!oauthToken || !oauthTokenSecret) {
      console.error('Invalid Trello OAuth token response:', bodyText)
      return NextResponse.json(
        { error: 'Invalid response from Trello while starting OAuth flow.' },
        { status: 502 }
      )
    }

    const authorizeUrl = new URL(AUTHORIZE_URL)
    authorizeUrl.searchParams.set('oauth_token', oauthToken)
    authorizeUrl.searchParams.set('scope', scope)
    authorizeUrl.searchParams.set('expiration', expiration)
    authorizeUrl.searchParams.set('name', APP_NAME)
    authorizeUrl.searchParams.set('return_url', callbackUrl)

    const response = NextResponse.json({
      authorizeUrl: authorizeUrl.toString(),
    })

    const secure = request.nextUrl.protocol === 'https:'

    response.cookies.set(REQUEST_TOKEN_COOKIE, oauthToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5, // 5 minutes
    })

    response.cookies.set(REQUEST_SECRET_COOKIE, oauthTokenSecret, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5,
    })

    response.cookies.set(USER_COOKIE, user.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5,
    })

    // Ensure shop context cookies persist for callback
    response.cookies.set('shopify_shop', shop.domain, {
      httpOnly: false,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return response
  } catch (error: any) {
    console.error('Trello OAuth 1.0 start error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start Trello OAuth flow' },
      { status: 500 }
    )
  }
}

