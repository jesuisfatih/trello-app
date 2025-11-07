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
      select: { notificationOptions: true, trelloMode: true },
    })

    const options = (settings?.notificationOptions as any) || {}
    const pollIntervalSeconds = sanitizeInterval(options.pollIntervalSeconds)

    return NextResponse.json({
      notify: user.notifyTrelloActivity,
      pollIntervalSeconds,
      trelloMode: settings?.trelloMode === 'single' ? 'single' : 'multi',
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

    let trelloMode: 'single' | 'multi' | undefined
    if (body.trelloMode === 'single' || body.trelloMode === 'multi') {
      trelloMode = body.trelloMode
    }

    const existingSettings = await prisma.settings.findUnique({
      where: { shopId: shop.id },
    })

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      })
    }

    const settingsUpdate: any = {}
    const notificationOptions = (existingSettings?.notificationOptions as any) || {}

    if (pollIntervalSeconds !== undefined) {
      settingsUpdate.notificationOptions = {
        ...notificationOptions,
        pollIntervalSeconds,
      }
    }

    if (trelloMode) {
      settingsUpdate.trelloMode = trelloMode
    }

    if (Object.keys(settingsUpdate).length > 0) {
      await prisma.settings.upsert({
        where: { shopId: shop.id },
        update: settingsUpdate,
        create: {
          shopId: shop.id,
          notificationOptions: settingsUpdate.notificationOptions ?? notificationOptions,
          trelloMode: settingsUpdate.trelloMode ?? existingSettings?.trelloMode ?? 'multi',
        },
      })
    }

    if (trelloMode === 'single') {
      const preferredConnection = await prisma.trelloConnection.findFirst({
        where: { shopId: shop.id },
        orderBy: { updatedAt: 'desc' },
      })

      if (preferredConnection) {
        await prisma.trelloConnection.update({
          where: { id: preferredConnection.id },
          data: { userId: null },
        })

        await prisma.trelloConnection.deleteMany({
          where: {
            shopId: shop.id,
            userId: { not: null },
            id: { not: preferredConnection.id },
          },
        })
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notifyTrelloActivity: true },
    })

    const updatedSettings = await prisma.settings.findUnique({
      where: { shopId: shop.id },
      select: { notificationOptions: true, trelloMode: true },
    })

    const nextOptions = (updatedSettings?.notificationOptions as any) || {}

    return NextResponse.json({
      notify: updatedUser?.notifyTrelloActivity ?? true,
      pollIntervalSeconds: sanitizeInterval(nextOptions.pollIntervalSeconds),
      trelloMode: updatedSettings?.trelloMode === 'single' ? 'single' : 'multi',
    })
  } catch (error: any) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
