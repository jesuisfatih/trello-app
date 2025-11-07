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

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const boardId = params.get('boardId')

    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 })
    }

    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const client = createTrelloClient(connection.token)
    const lists = await exponentialBackoff(() => client.getLists(boardId))

    return NextResponse.json({ lists })
  } catch (error: any) {
    console.error('Get lists error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lists' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { connection } = await getContext(request)

    await checkTrelloRateLimit(connection.token)

    const body = await request.json()
    const { boardId, name, pos } = body || {}

    if (!boardId || !name) {
      return NextResponse.json(
        { error: 'boardId and name are required to create a list' },
        { status: 400 }
      )
    }

    const client = createTrelloClient(connection.token)
    const list = await exponentialBackoff(() =>
      client.createList(name, boardId, pos || 'bottom')
    )

    return NextResponse.json({ list })
  } catch (error: any) {
    console.error('Create list error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create list' },
      { status: 500 }
    )
  }
}

