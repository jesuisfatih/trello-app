import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'

const EVENTS_LIMIT = 20
const DEFAULT_POLL_INTERVAL = 30

export async function GET(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)

    const settings = await prisma.settings.findUnique({
      where: { shopId: shop.id },
      select: { notificationOptions: true },
    })

    const options = (settings?.notificationOptions as any) || {}
    const pollIntervalSeconds = Math.max(
      10,
      Math.min(300, Number(options.pollIntervalSeconds) || DEFAULT_POLL_INTERVAL)
    )

    let events: any[] = []

    if (user.notifyTrelloActivity) {
      events = await prisma.eventLog.findMany({
        where: {
          shopId: shop.id,
          type: 'trello_activity',
          OR: [
            { userId: user.id },
            { userId: null },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: EVENTS_LIMIT,
      })
    }

    return NextResponse.json({
      events,
      preferences: {
        notify: user.notifyTrelloActivity,
        pollIntervalSeconds,
      },
    })
  } catch (error: any) {
    console.error('Fetch Trello events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load Trello events' },
      { status: 500 }
    )
  }
}
