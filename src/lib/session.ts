import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { validateSessionToken } from '@/lib/shopify'

type ShopEntity = NonNullable<Awaited<ReturnType<typeof prisma.shop.findUnique>>>
type UserEntity = NonNullable<Awaited<ReturnType<typeof prisma.user.findFirst>>>

interface SessionContext {
  shop: ShopEntity
  user: UserEntity
  sessionToken: string
  payload: any
}

function extractEmail(payload: any): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return (
    payload.email ||
    payload.associated_user_email ||
    payload.account_owner ||
    null
  )
}

export async function requireSessionContext(request: NextRequest): Promise<SessionContext> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization header')
  }

  const sessionToken = authHeader.substring(7)

  const payload = await validateSessionToken(sessionToken)
  const shopDomain = payload?.dest?.replace?.('https://', '')

  if (!shopDomain) {
    throw new Error('Invalid session token payload: missing shop domain')
  }

  const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } })

  if (!shop) {
    throw new Error('Shop not installed. Please install the app first.')
  }

  const sub = payload?.sub as string | undefined
  const sid = payload?.sid as string | undefined

  if (!sub && !sid) {
    throw new Error('Session token missing user identifier')
  }

  const email = extractEmail(payload)

  const userMatchConditions = [] as any[]
  if (sub) {
    userMatchConditions.push({ sub })
  }
  if (sid) {
    userMatchConditions.push({ sid })
  }

  let user = await prisma.user.findFirst({
    where: {
      shopId: shop.id,
      OR: userMatchConditions,
    },
  })

  const data = {
    shopId: shop.id,
    sub: sub ?? null,
    sid: sid ?? null,
    email,
    role: payload?.account_owner === 'true' ? 'owner' : 'staff',
  }

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data,
    })
  } else {
    const createData = {
      ...data,
      sub: data.sub ?? (data.sid ? `sid:${data.sid}` : undefined),
      role: data.role,
    }

    user = await prisma.user.create({ data: createData })
  }

  return {
    shop: shop as ShopEntity,
    user: user as UserEntity,
    sessionToken,
    payload,
  }
}


