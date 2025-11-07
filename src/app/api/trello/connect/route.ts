import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireSessionContext } from '@/lib/session';

/**
 * Manual Trello connection with API Key + Token
 */
export async function POST(request: NextRequest) {
  try {
    const { shop, user } = await requireSessionContext(request);

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Validate token format (Trello tokens start with ATTA)
    if (!token.startsWith('ATTA') && !token.match(/^[a-zA-Z0-9]{64}$/)) {
      return NextResponse.json({ error: 'Invalid token format. Trello tokens should start with ATTA or be 64 characters long.' }, { status: 400 });
    }

    // Test connection with token
    try {
      const apiKey = process.env.TRELLO_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Trello API key is not configured. Please set TRELLO_API_KEY environment variable.' },
          { status: 500 }
        );
      }

      // Direct API call to test token (simpler and more reliable)
      let member;
      try {
        const testUrl = `https://api.trello.com/1/members/me?key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}`;
        const testResponse = await fetch(testUrl);
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error('Trello API test failed:', {
            status: testResponse.status,
            statusText: testResponse.statusText,
            error: errorText,
            apiKey: `${apiKey.substring(0, 8)}...`,
            tokenPrefix: token.substring(0, 8),
          });
          
          if (testResponse.status === 401) {
            throw new Error('Invalid Trello token or API key. Please verify your token is correct and that TRELLO_API_KEY matches your Trello app configuration.');
          } else if (testResponse.status === 400) {
            throw new Error('Bad request. Please check your API key and token format.');
          }
          throw new Error(`Trello API error: ${testResponse.status} - ${errorText}`);
        }
        
        member = await testResponse.json();
        
        if (!member || !member.id) {
          throw new Error('Invalid token: Unable to retrieve member information');
        }
      } catch (apiError: any) {
        // Re-throw with better error message if not already handled
        if (apiError.message?.includes('Trello API error') || apiError.message?.includes('Invalid Trello')) {
          throw apiError;
        }
        throw new Error(`Failed to connect to Trello: ${apiError.message || 'Unknown error'}`);
      }

    // Save connection
    await prisma.trelloConnection.upsert({
      where: {
        shopId_userId: {
          shopId: shop.id,
          userId: user.id,
        },
      },
      create: {
        shopId: shop.id,
        userId: user.id,
        trelloMemberId: member.id,
        token,
        scope: 'read,write,account',
        expiresAt: null,
      },
      update: {
        token,
        trelloMemberId: member.id,
        scope: 'read,write,account',
      },
    });

      await prisma.eventLog.create({
        data: {
        shopId: shop.id,
        userId: user.id,
          source: 'trello',
          type: 'manual_token_connected',
          payload: { memberId: member.id, memberName: member.fullName || member.username },
          status: 'success',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Trello connected successfully',
        member: { id: member.id, fullName: member.fullName || member.username },
      });
    } catch (trelloError: any) {
      console.error('Trello API error:', trelloError);
      
      // Provide specific error messages
      if (trelloError.message?.includes('invalid token') || trelloError.message?.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid Trello token. Please check your token and try again.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: trelloError.message || 'Failed to connect to Trello. Please verify your token is correct.' },
        { status: 500 }
      );
    }
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
    const { shop, user } = await requireSessionContext(request);

    let connection = await prisma.trelloConnection.findFirst({
      where: {
        shopId: shop.id,
        userId: user.id,
      },
    });

    if (!connection) {
      connection = await prisma.trelloConnection.findFirst({
        where: {
          shopId: shop.id,
          userId: null,
        },
      });
    }

    const connected = Boolean(connection);

    return NextResponse.json({
      connected,
      connection: connected
        ? {
            memberId: connection!.trelloMemberId,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Trello connect GET error:', error);
    return NextResponse.json({ 
      connected: false,
      connection: null,
      error: error.message 
    }, { status: 200 }); // Return 200 to prevent UI errors
  }
}

