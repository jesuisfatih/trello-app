import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient } from '@/lib/trello'
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter'
import { createCardSchema } from '@/lib/validation'
import prisma from '@/lib/db'
import { requireSessionContext } from '@/lib/session'
import { assertTrelloConnection } from '@/lib/trello-connection'

async function getContext(request: NextRequest) {
  const { shop, user } = await requireSessionContext(request)
  const connection = await assertTrelloConnection(shop.id, user.id)
  return { shop, connection }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const listId = searchParams.get('listId')

    if (!listId) {
      return NextResponse.json(
        { error: 'listId is required' },
        { status: 400 }
      )
    }

    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const client = createTrelloClient(connection.token)
    const cards = await exponentialBackoff(() => client.getCards(listId))

    return NextResponse.json({ cards })
  } catch (error: any) {
    console.error('Get cards error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { shop, connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const body = await request.json()
    const validatedData = createCardSchema.parse(body)

    const client = createTrelloClient(connection.token)
    const card = await exponentialBackoff(() =>
      client.createCard(validatedData as any)
    )

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        userId: connection.userId,
        source: 'trello',
        type: 'card_created',
        payload: {
          cardId: card.id,
          cardName: card.name,
          listId: card.idList,
        },
        status: 'success',
      },
    })

    return NextResponse.json({ card })
  } catch (error: any) {
    console.error('Create card error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create card' },
      { status: 500 }
    )
  }
}

