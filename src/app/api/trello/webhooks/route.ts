import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient } from '@/lib/trello'
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter'
import { createWebhookSchema, trelloWebhookSchema } from '@/lib/validation'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'
import { assertTrelloConnection } from '@/lib/trello-connection'
import { registerTrelloWebhook } from '@/lib/webhooks'

// HEAD request for Trello webhook verification
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

// POST to receive webhook events
export async function POST(request: NextRequest) {
  try {
    if (request.method === 'HEAD') {
      return new NextResponse(null, { status: 200 })
    }

    const body = await request.json()
    const validatedData = trelloWebhookSchema.parse(body)

    const webhook = await prisma.trelloWebhook.findFirst({
      where: { modelId: validatedData.model.id, active: true },
      include: { shop: true },
    })

    if (!webhook) {
      console.log('Webhook received for unknown model:', validatedData.model.id)
      return NextResponse.json({ received: true })
    }

    await prisma.eventLog.create({
      data: {
        shopId: webhook.shopId,
        source: 'trello',
        type: `webhook_${validatedData.action.type}`,
        payload: validatedData,
        status: 'success',
      },
    })

    console.log('Trello webhook received:', {
      action: validatedData.action.type,
      model: validatedData.model.id,
      shop: webhook.shop.domain,
    })

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Trello webhook error:', error)

    try {
      await prisma.eventLog.create({
        data: {
          source: 'trello',
          type: 'webhook_error',
          payload: { error: error.message },
          status: 'error',
          errorMsg: error.message,
        },
      })
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    return NextResponse.json({ received: true })
  }
}

// Create new webhook
export async function PUT(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request)
    const connection = await assertTrelloConnection(shop.id, user.id)

    await checkTrelloRateLimit(connection.token)

    const body = await request.json()
    const { description, idModel } = createWebhookSchema.parse(body)

    const webhook = await exponentialBackoff(() =>
      registerTrelloWebhook(shop.id, user.id, idModel, description)
    )

    return NextResponse.json({ webhook })
  } catch (error: any) {
    console.error('Create webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

