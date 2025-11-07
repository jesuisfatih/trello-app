import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'

/**
 * Disconnect Trello - Remove connection for current user
 */
export async function POST(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)

    await prisma.trelloConnection.deleteMany({
      where: {
        shopId: shop.id,
        OR: [{ userId: user.id }, { userId: null }],
      },
    })

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
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

