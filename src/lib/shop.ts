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

