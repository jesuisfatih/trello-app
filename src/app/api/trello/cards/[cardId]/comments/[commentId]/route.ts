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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ cardId: string; commentId: string }> }
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
      client.updateComment(params.cardId, params.commentId, body.text)
    )

    return NextResponse.json({ comment })
  } catch (error: any) {
    console.error('Update comment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ cardId: string; commentId: string }> }
) {
  try {
    const params = await context.params
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const client = createTrelloClient(connection.token)
    await exponentialBackoff(() =>
      client.deleteComment(params.cardId, params.commentId)
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

