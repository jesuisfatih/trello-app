import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'

const EVENTS_LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)

    const events = await prisma.eventLog.findMany({
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

    return NextResponse.json({
      events,
    })
  } catch (error: any) {
    console.error('Fetch Trello events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load Trello events' },
      { status: 500 }
    )
  }
}
