import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient } from '@/lib/trello'
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter'
import { updateCardSchema } from '@/lib/validation'
import { requireSessionContext } from '@/lib/session'
import { assertTrelloConnection } from '@/lib/trello-connection'

async function getContext(request: NextRequest) {
  const { shop, user } = await requireSessionContext(request)
  const connection = await assertTrelloConnection(shop.id, user.id)
  return { connection }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const params = await context.params
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const client = createTrelloClient(connection.token)
    const card = await exponentialBackoff(() => client.getCard(params.cardId))

    return NextResponse.json({ card })
  } catch (error: any) {
    console.error('Get card error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch card' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const params = await context.params
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const body = await request.json()
    const validatedData = updateCardSchema.parse(body)

    const client = createTrelloClient(connection.token)
    const card = await exponentialBackoff(() =>
      client.updateCard(params.cardId, validatedData as any)
    )

    return NextResponse.json({ card })
  } catch (error: any) {
    console.error('Update card error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update card' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const params = await context.params
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const client = createTrelloClient(connection.token)
    await exponentialBackoff(() => client.deleteCard(params.cardId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete card error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete card' },
      { status: 500 }
    )
  }
}

