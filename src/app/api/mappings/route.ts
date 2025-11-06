import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/shopify';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    const payload = await validateSessionToken(sessionToken);
    const shopDomain = payload.dest.replace('https://', '');

    const shop = await prisma.shop.findUnique({
      where: { domain: shopDomain },
      include: { settings: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      mappings: shop.settings?.mappingOptions || {},
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    const payload = await validateSessionToken(sessionToken);
    const shopDomain = payload.dest.replace('https://', '');

    const shop = await prisma.shop.findUnique({
      where: { domain: shopDomain },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const body = await request.json();
    const { mappings } = body;

    await prisma.settings.upsert({
      where: { shopId: shop.id },
      create: { shopId: shop.id, mappingOptions: mappings },
      update: { mappingOptions: mappings },
    });

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        source: 'system',
        type: 'mappings_updated',
        payload: { mappings },
        status: 'success',
      },
    });

    return NextResponse.json({ message: 'Mappings updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
