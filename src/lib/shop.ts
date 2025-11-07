import { NextResponse } from 'next/server'

const SHOPIFY_SHOP_COOKIE = 'shopify_shop'
const SHOPIFY_HOST_COOKIE = 'shopify_host'

export function decodeHostParam(hostParam: string): string {
  if (!hostParam) {
    return hostParam
  }

  try {
    const decoded = Buffer.from(hostParam, 'base64').toString('utf8')
    if (decoded) {
      return decoded
    }
  } catch (error) {
    // hostParam was not base64 encoded – fall back to raw value
  }

  return hostParam
}

export function extractShopFromHost(hostParam?: string | null): string | null {
  if (!hostParam) {
    return null
  }

  const decoded = decodeHostParam(hostParam)
  const match = decoded.match(/([a-z0-9][a-z0-9-]*\.myshopify\.com)/i)
  return match ? match[1].toLowerCase() : null
}

export function normalizeShopDomain(shop?: string | null): string | null {
  if (!shop) {
    return null
  }

  const trimmed = shop.trim().toLowerCase()
  if (trimmed.endsWith('.myshopify.com')) {
    return trimmed
  }

  if (/^[a-z0-9][a-z0-9-]*$/.test(trimmed)) {
    return `${trimmed}.myshopify.com`
  }

  return null
}

export function getShopDomainFromRequest({
  hostParam,
  shopParam,
}: {
  hostParam?: string | null
  shopParam?: string | null
}): { shopDomain: string | null; normalizedHost: string | null } {
  const normalizedHost = hostParam || null

  const shopFromQuery = normalizeShopDomain(shopParam)
  if (shopFromQuery) {
    return { shopDomain: shopFromQuery, normalizedHost }
  }

  const shopFromHost = extractShopFromHost(hostParam)
  return { shopDomain: shopFromHost, normalizedHost }
}

export function setShopCookies(response: NextResponse, shopDomain: string, host?: string | null) {
  const isProduction = process.env.NODE_ENV === 'production'
  const sameSite = isProduction ? 'none' : 'lax'
  const secure = isProduction

  response.cookies.set(SHOPIFY_SHOP_COOKIE, shopDomain, {
    httpOnly: false,
    secure,
    sameSite,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  if (host) {
    response.cookies.set(SHOPIFY_HOST_COOKIE, host, {
      httpOnly: false,
      secure,
      sameSite,
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
}

