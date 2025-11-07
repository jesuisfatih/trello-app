import { NextRequest, NextResponse } from 'next/server';
import { createTrelloClient } from '@/lib/trello';
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter';
import prisma from '@/lib/db';
import { requireSessionContext } from '@/lib/session';
import { assertTrelloConnection } from '@/lib/trello-connection';

async function getContext(request: NextRequest) {
  const { shop, user } = await requireSessionContext(request);
  const connection = await assertTrelloConnection(shop.id, user.id);
  return { shop, user, connection };
}

export async function GET(request: NextRequest) {
  try {
    const { connection } = await getContext(request);

    await checkTrelloRateLimit(connection.token);

    const client = createTrelloClient(connection.token);

    const boards = await exponentialBackoff(() => client.getBoards());

    return NextResponse.json({ boards });
  } catch (error: any) {
    console.error('Get boards error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch boards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { shop, connection } = await getContext(request);

    await checkTrelloRateLimit(connection.token);

    const body = await request.json();
    const { name, desc, defaultLists } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      );
    }

    const client = createTrelloClient(connection.token);

    const board = await exponentialBackoff(() =>
      client.createBoard(name, { desc, defaultLists })
    );

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        userId: connection.userId,
        source: 'trello',
        type: 'board_created',
        payload: { boardId: board.id, boardName: board.name },
        status: 'success',
      },
    });

    return NextResponse.json({ board });
  } catch (error: any) {
    console.error('Create board error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create board' },
      { status: 500 }
    );
  }
}

