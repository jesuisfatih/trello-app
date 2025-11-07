import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'
import { getTrelloMode } from '@/lib/trello-connection'

const RECENT_EVENTS_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { shop } = await requireSessionContext(request)

    const mode = await getTrelloMode(shop.id)

    const users = await prisma.user.findMany({
      where: { shopId: shop.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        sub: true,
        role: true,
        notifyTrelloActivity: true,
        trelloConnections: {
          select: {
            trelloMemberId: true,
            token: false,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    const events = await prisma.eventLog.findMany({
      where: {
        shopId: shop.id,
        type: 'trello_activity',
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_EVENTS_LIMIT,
      select: {
        id: true,
        userId: true,
        createdAt: true,
        payload: true,
      },
    })

    const eventByUser = new Map<string | null, any>()
    for (const event of events) {
      if (!eventByUser.has(event.userId ?? null)) {
        eventByUser.set(event.userId ?? null, event)
      }
    }

    const result = users.map((user) => {
      const connection = user.trelloConnections[0] || null
      const latestEvent = eventByUser.get(user.id) || null

      return {
        id: user.id,
        email: user.email,
        sub: user.sub,
        role: user.role,
        notify: user.notifyTrelloActivity,
        trelloMemberId: connection?.trelloMemberId ?? null,
        trelloConnectedAt: connection?.createdAt ?? null,
        trelloUpdatedAt: connection?.updatedAt ?? null,
        latestEvent,
      }
    })

    return NextResponse.json({
      users: result,
      trelloMode: mode,
    })
  } catch (error: any) {
    console.error('List Trello users error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load users' },
      { status: 500 }
    )
  }
}
