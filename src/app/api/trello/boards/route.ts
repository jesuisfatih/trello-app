import { NextRequest, NextResponse } from 'next/server';
import { createTrelloClient } from '@/lib/trello';
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter';
import prisma from '@/lib/db';
import { validateSessionToken } from '@/lib/shopify';

async function getShopFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization header');
  }

  const sessionToken = authHeader.substring(7);
  const payload = await validateSessionToken(sessionToken);
  const shop = payload.dest.replace('https://', '');

  return await prisma.shop.findUnique({
    where: { domain: shop },
    include: { trelloConnections: true },
  });
}

export async function GET(request: NextRequest) {
  try {
    const shop = await getShopFromRequest(request);
    
    if (!shop || !shop.trelloConnections[0]) {
      return NextResponse.json(
        { error: 'Trello not connected' },
        { status: 401 }
      );
    }

    const trelloConnection = shop.trelloConnections[0];
    await checkTrelloRateLimit(trelloConnection.token);

    const client = createTrelloClient(trelloConnection.token);

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
    const shop = await getShopFromRequest(request);
    
    if (!shop || !shop.trelloConnections[0]) {
      return NextResponse.json(
        { error: 'Trello not connected' },
        { status: 401 }
      );
    }

    const trelloConnection = shop.trelloConnections[0];
    await checkTrelloRateLimit(trelloConnection.token);

    const body = await request.json();
    const { name, desc, defaultLists } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      );
    }

    const client = createTrelloClient(trelloConnection.token);

    const board = await exponentialBackoff(() =>
      client.createBoard(name, { desc, defaultLists })
    );

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
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

