import { NextRequest, NextResponse } from 'next/server';
import { createTrelloClient } from '@/lib/trello';
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter';
import { updateCardSchema } from '@/lib/validation';
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
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const params = await context.params;
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

    const card = await exponentialBackoff(() =>
      client.getCard(params.cardId)
    );

    return NextResponse.json({ card });
  } catch (error: any) {
    console.error('Get card error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch card' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const params = await context.params;
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
    const validatedData = updateCardSchema.parse(body);

    const client = createTrelloClient(trelloConnection.token);

    const card = await exponentialBackoff(() =>
      client.updateCard(params.cardId, validatedData as any)
    );

    return NextResponse.json({ card });
  } catch (error: any) {
    console.error('Update card error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update card' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
) {
  try {
    const params = await context.params;
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
      client.deleteCard(params.cardId)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete card error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete card' },
      { status: 500 }
    );
  }
}

