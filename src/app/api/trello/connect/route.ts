import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/shopify';
import prisma from '@/lib/db';
import { createTrelloClient } from '@/lib/trello';

/**
 * Manual Trello connection with API Key + Token
 */
export async function POST(request: NextRequest) {
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
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Test connection with token
    const client = createTrelloClient(token);
    const member = await client.request('GET', '/1/members/me');

    // Save connection
    await prisma.trelloConnection.upsert({
      where: { shopId: shop.id },
      create: {
        shopId: shop.id,
        trelloMemberId: member.id,
        token: token,
        scope: 'read,write',
        expiresAt: null,
      },
      update: {
        token: token,
        trelloMemberId: member.id,
      },
    });

    await prisma.eventLog.create({
      data: {
        shopId: shop.id,
        source: 'trello',
        type: 'manual_token_connected',
        payload: { memberId: member.id },
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trello connected successfully',
      member: { id: member.id, fullName: member.fullName },
    });
  } catch (error: any) {
    console.error('Trello connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Connection failed' },
      { status: 500 }
    );
  }
}

/**
 * Check Trello connection status
 */
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
      include: { trelloConnections: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const connected = shop.trelloConnections.length > 0;

    return NextResponse.json({
      connected,
      connection: connected ? {
        memberId: shop.trelloConnections[0].trelloMemberId,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

