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

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
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

    const board = await exponentialBackoff(() =>
      client.getBoard(params.boardId)
    );

    return NextResponse.json({ board });
  } catch (error: any) {
    console.error('Get board error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch board' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
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
    const client = createTrelloClient(trelloConnection.token);

    const board = await exponentialBackoff(() =>
      client.updateBoard(params.boardId, body)
    );

    return NextResponse.json({ board });
  } catch (error: any) {
    console.error('Update board error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update board' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
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

    await exponentialBackoff(() =>
      client.deleteBoard(params.boardId)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete board error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete board' },
      { status: 500 }
    );
  }
}

