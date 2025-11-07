import { NextRequest, NextResponse } from 'next/server'
import { createTrelloClient } from '@/lib/trello'
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter'
import { requireSessionContext } from '@/lib/session'
import { assertTrelloConnection } from '@/lib/trello-connection'

async function getContext(request: NextRequest) {
  const { shop, user } = await requireSessionContext(request)
  const connection = await assertTrelloConnection(shop.id, user.id)
  return { shop, connection }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ boardId: string }> }
) {
  try {
    const params = await context.params
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const client = createTrelloClient(connection.token)
    const board = await exponentialBackoff(() => client.getBoard(params.boardId))

    return NextResponse.json({ board })
  } catch (error: any) {
    console.error('Get board error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch board' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ boardId: string }> }
) {
  const params = await context.params

  try {
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const body = await request.json()
    const client = createTrelloClient(connection.token)
    const board = await exponentialBackoff(() =>
      client.updateBoard(params.boardId, body)
    )

    return NextResponse.json({ board })
  } catch (error: any) {
    console.error('Update board error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update board' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ boardId: string }> }
) {
  const params = await context.params

  try {
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const client = createTrelloClient(connection.token)
    await exponentialBackoff(() => client.deleteBoard(params.boardId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete board error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete board' },
      { status: 500 }
    )
  }
}

