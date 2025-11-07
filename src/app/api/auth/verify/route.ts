import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'
import { getTrelloConnectionForUser } from '@/lib/trello-connection'

/**
 * Verify session token and return shop/user info
 * Used for client-side session validation
 */
export async function POST(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)

    const trelloConnection = await getTrelloConnectionForUser(shop.id, user.id)

    return NextResponse.json({
      authenticated: true,
      shop: {
        id: shop.id,
        domain: shop.domain,
        plan: shop.plan,
        status: shop.status,
      },
      trelloConnected: Boolean(trelloConnection),
      user: {
        id: user.id,
        sub: user.sub,
        sid: user.sid,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Verification failed', authenticated: false },
      { status: 401 }
    )
  }
}

