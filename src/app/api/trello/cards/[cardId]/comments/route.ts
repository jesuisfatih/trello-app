import { NextRequest, NextResponse } from 'next/server';
import { createTrelloClient } from '@/lib/trello';
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter';
import { addCommentSchema } from '@/lib/validation';
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

    const comments = await exponentialBackoff(() =>
      client.getComments(params.cardId)
    );

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { text } = addCommentSchema.parse(body);

    const client = createTrelloClient(trelloConnection.token);

    const comment = await exponentialBackoff(() =>
      client.addComment(params.cardId, text)
    );

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        source: 'trello',
        type: 'comment_added',
        payload: { cardId: params.cardId, commentId: comment.id },
        status: 'success',
      },
    });

    return NextResponse.json({ comment });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}

