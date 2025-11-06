import { NextRequest, NextResponse } from 'next/server';
import { createTrelloClient } from '@/lib/trello';
import { checkTrelloRateLimit, exponentialBackoff } from '@/lib/rate-limiter';
import { createWebhookSchema, trelloWebhookSchema } from '@/lib/validation';
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

// HEAD request for Trello webhook verification
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// POST to receive webhook events
export async function POST(request: NextRequest) {
  try {
    // Trello webhook verification HEAD request
    if (request.method === 'HEAD') {
      return new NextResponse(null, { status: 200 });
    }

    const body = await request.json();
    const validatedData = trelloWebhookSchema.parse(body);

    // Find shop by webhook model ID
    const webhook = await prisma.trelloWebhook.findFirst({
      where: { modelId: validatedData.model.id, active: true },
      include: { shop: true },
    });

    if (!webhook) {
      console.log('Webhook received for unknown model:', validatedData.model.id);
      return NextResponse.json({ received: true });
    }

    // Log the event
    await prisma.eventLog.create({
      data: {
        shopId: webhook.shopId,
        source: 'trello',
        type: `webhook_${validatedData.action.type}`,
        payload: validatedData,
        status: 'success',
      },
    });

    // Process webhook action
    console.log('Trello webhook received:', {
      action: validatedData.action.type,
      model: validatedData.model.id,
      shop: webhook.shop.domain,
    });

    // TODO: Implement specific action handlers
    // Example: sync card updates back to Shopify

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Trello webhook error:', error);
    
    // Log error but return 200 to prevent retries
    try {
      await prisma.eventLog.create({
        data: {
          source: 'trello',
          type: 'webhook_error',
          payload: { error: error.message },
          status: 'error',
          errorMsg: error.message,
        },
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json({ received: true });
  }
}

// Create new webhook
export async function PUT(request: NextRequest) {
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
    const { description, idModel } = createWebhookSchema.parse(body);

    const callbackUrl = `${process.env.SHOPIFY_APP_URL}/api/trello/webhooks`;

    const client = createTrelloClient(trelloConnection.token);

    const webhook = await exponentialBackoff(() =>
      client.createWebhook({
        description,
        callbackURL: callbackUrl,
        idModel,
      })
    );

    // Store webhook in database
    await prisma.trelloWebhook.create({
      data: {
        shopId: shop.id,
        trelloWebhookId: webhook.id,
        modelId: idModel,
        callbackUrl,
        description,
        active: true,
      },
    });

    return NextResponse.json({ webhook });
  } catch (error: any) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

