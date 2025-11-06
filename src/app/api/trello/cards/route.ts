import { NextRequest, NextResponse } from 'next/server';
import { createTrelloClient } from '@/lib/trello';
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter';
import { createCardSchema } from '@/lib/validation';
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
    const { searchParams } = request.nextUrl;
    const listId = searchParams.get('listId');

    if (!listId) {
      return NextResponse.json(
        { error: 'listId is required' },
        { status: 400 }
      );
    }

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

    const cards = await exponentialBackoff(() =>
      client.getCards(listId)
    );

    return NextResponse.json({ cards });
  } catch (error: any) {
    console.error('Get cards error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cards' },
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
    
    // Validate input
    const validatedData = createCardSchema.parse(body);

    const client = createTrelloClient(trelloConnection.token);

    const card = await exponentialBackoff(() =>
      client.createCard(validatedData as any)
    );

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        source: 'trello',
        type: 'card_created',
        payload: { cardId: card.id, cardName: card.name, listId: card.idList },
        status: 'success',
      },
    });

    return NextResponse.json({ card });
  } catch (error: any) {
    console.error('Create card error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create card' },
      { status: 500 }
    );
  }
}

