import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient } from '@/lib/trello'
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter'
import { requireSessionContext } from '@/lib/session'
import { assertTrelloConnection } from '@/lib/trello-connection'

async function getContext(request: NextRequest) {
  const { shop, user } = await requireSessionContext(request)
  const connection = await assertTrelloConnection(shop.id, user.id)
  return { connection }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const params = await context.params
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const body = await request.json()

    if (!body?.text) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    const client = createTrelloClient(connection.token)
    const comment = await exponentialBackoff(() =>
      client.addComment(params.cardId, body.text)
    )

    return NextResponse.json({ comment })
  } catch (error: any) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    )
  }
}

