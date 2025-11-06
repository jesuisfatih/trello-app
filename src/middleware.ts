import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getShopDomainFromRequest } from '@/lib/shop'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const publicRoutes = [
  '/api/health',
  '/api/shopify/webhooks',
  '/api/trello/webhooks',
  '/api/trello/oauth/callback',
  '/api/shopify/auth',
  '/api/shopify/install',
  '/auth/login',
]

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const response = NextResponse.next()

  // Security header
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors https://*.myshopify.com https://admin.shopify.com https://*.shopify.com;"
  )

  const hostParam = searchParams.get('host')
  const shopParam = searchParams.get('shop')

  const { shopDomain } = getShopDomainFromRequest({
    hostParam,
    shopParam,
  })

  const isSecure = request.nextUrl.protocol === 'https:'
  const sameSite = isSecure ? 'none' : 'lax'

  if (hostParam) {
    response.cookies.set('shopify_host', hostParam, {
      httpOnly: false,
      secure: isSecure,
      sameSite,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
  }

  if (shopDomain) {
    response.cookies.set('shopify_shop', shopDomain, {
      httpOnly: false,
      secure: isSecure,
      sameSite,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
  }

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  const hasHostContext =
    request.cookies.get('shopify_host')?.value ||
    hostParam ||
    null

  const hasShopContext =
    request.cookies.get('shopify_shop')?.value ||
    shopDomain ||
    null

  if (pathname.startsWith('/app') && !hasHostContext && !hasShopContext) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}