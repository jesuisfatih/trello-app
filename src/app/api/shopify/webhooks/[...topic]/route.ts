import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { processMappings } from '@/lib/mapping-engine';

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}

async function handleAppUninstalled(shop: string, payload: any) {
  const shopRecord = await prisma.shop.findUnique({
    where: { domain: shop },
    select: { id: true },
  })

  if (shopRecord) {
    await prisma.$transaction([
      prisma.trelloConnection.deleteMany({ where: { shopId: shopRecord.id } }),
      prisma.shop.update({
        where: { domain: shop },
        data: {
          status: 'uninstalled',
          uninstalledAt: new Date(),
          accessTokenOffline: null,
        },
      }),
    ])
  }

  await prisma.eventLog.create({
    data: {
      source: 'shopify',
      type: 'app_uninstalled',
      payload: payload,
      status: 'success',
    },
  });

  console.log(`App uninstalled for shop: ${shop}`);
}

async function handleCustomersDataRequest(shop: string, payload: any) {
  // GDPR: Log the data request
  await prisma.eventLog.create({
    data: {
      source: 'shopify',
      type: 'customers_data_request',
      payload: payload,
      status: 'success',
    },
  });

  console.log(`Customer data request for shop: ${shop}`);
  // TODO: Implement actual data export logic
}

async function handleCustomersRedact(shop: string, payload: any) {
  // GDPR: Redact customer data
  await prisma.eventLog.create({
    data: {
      source: 'shopify',
      type: 'customers_redact',
      payload: payload,
      status: 'success',
    },
  });

  console.log(`Customer redaction request for shop: ${shop}`);
  // TODO: Implement actual customer data deletion
}

async function handleShopRedact(shop: string, payload: any) {
  // GDPR: Delete all shop data
  const shopRecord = await prisma.shop.findUnique({
    where: { domain: shop },
  });

  if (shopRecord) {
    await prisma.shop.delete({
      where: { domain: shop },
    });
  }

  await prisma.eventLog.create({
    data: {
      source: 'shopify',
      type: 'shop_redact',
      payload: payload,
      status: 'success',
    },
  });

  console.log(`Shop redaction completed for: ${shop}`);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ topic: string[] }> }
) {
  try {
    const params = await context.params;
    const topic = params.topic.join('/');
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const shop = request.headers.get('x-shopify-shop-domain');

    if (!hmac || !shop) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    // Verify webhook authenticity
    if (!verifyShopifyWebhook(rawBody, hmac)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    // Handle different webhook topics
    switch (topic) {
      case 'app/uninstalled':
        await handleAppUninstalled(shop, payload);
        break;
      
      case 'customers/data_request':
        await handleCustomersDataRequest(shop, payload);
        break;
      
      case 'customers/redact':
        await handleCustomersRedact(shop, payload);
        break;
      
      case 'shop/redact':
        await handleShopRedact(shop, payload);
        break;
      
      default:
        console.log(`Processing webhook topic: ${topic}`);
        
        // Get shop record
        const shopRecord = await prisma.shop.findUnique({
          where: { domain: shop },
        });

        if (shopRecord) {
          // Try to process mappings for this webhook
          await processMappings(shopRecord.id, topic, payload);
        }
        
        await prisma.eventLog.create({
          data: {
            shopId: shopRecord?.id,
            source: 'shopify',
            type: `webhook_${topic.replace('/', '_')}`,
            payload: payload,
            status: 'success',
          },
        });
    }

    // Always respond quickly with 200
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Log error but still return 200 to avoid retries
    try {
      await prisma.eventLog.create({
        data: {
          source: 'shopify',
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

