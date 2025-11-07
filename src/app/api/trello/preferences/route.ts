import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'

const DEFAULT_POLL_INTERVAL = 30

function sanitizeInterval(value: any) {
  const num = Number(value)
  if (!Number.isFinite(num)) return DEFAULT_POLL_INTERVAL
  return Math.max(10, Math.min(300, Math.round(num)))
}

export async function GET(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)

    const settings = await prisma.settings.findUnique({
      where: { shopId: shop.id },
      select: { notificationOptions: true },
    })

    const options = (settings?.notificationOptions as any) || {}
    const pollIntervalSeconds = sanitizeInterval(options.pollIntervalSeconds)

    return NextResponse.json({
      notify: user.notifyTrelloActivity,
      pollIntervalSeconds,
    })
  } catch (error: any) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load notification preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)
    const body = await request.json().catch(() => ({}))

    const updates: any = {}

    if (typeof body.notify === 'boolean') {
      updates.notifyTrelloActivity = body.notify
    }

    let pollIntervalSeconds: number | undefined
    if (body.pollIntervalSeconds !== undefined) {
      pollIntervalSeconds = sanitizeInterval(body.pollIntervalSeconds)
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      })
    }

    if (pollIntervalSeconds !== undefined) {
      await prisma.settings.upsert({
        where: { shopId: shop.id },
        update: {
          notificationOptions: {
            pollIntervalSeconds,
          },
        },
        create: {
          shopId: shop.id,
          notificationOptions: {
            pollIntervalSeconds,
          },
        },
      })
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notifyTrelloActivity: true },
    })

    const updatedSettings = await prisma.settings.findUnique({
      where: { shopId: shop.id },
      select: { notificationOptions: true },
    })

    const nextOptions = (updatedSettings?.notificationOptions as any) || {}

    return NextResponse.json({
      notify: updatedUser?.notifyTrelloActivity ?? true,
      pollIntervalSeconds: sanitizeInterval(nextOptions.pollIntervalSeconds),
    })
  } catch (error: any) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
