import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'
import { getTrelloMode } from '@/lib/trello-connection'

/**
 * Disconnect Trello - Remove connection for current user
 */
export async function POST(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)
    const mode = await getTrelloMode(shop.id)

    if (mode === 'single' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Only the store owner can manage the shared Trello connection.' }, { status: 403 })
    }

    await prisma.trelloConnection.deleteMany({
      where: {
        shopId: shop.id,
        userId: mode === 'single' ? null : user.id,
      },
    })

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        userId: user.id,
        source: 'trello',
        type: 'disconnected',
        payload: { userId: user.id },
        status: 'success',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

