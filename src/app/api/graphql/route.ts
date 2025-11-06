import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, exchangeToken, graphqlRequest } from '@/lib/shopify';

/**
 * GraphQL proxy endpoint for client-side queries
 * Handles token exchange and forwards queries to Shopify Admin API
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);
    
    // Validate session token
    const payload = await validateSessionToken(sessionToken);
    
    if (!payload || !payload.dest) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    const shop = payload.dest.replace('https://', '');
    
    // Get the GraphQL query from request body
    const body = await request.json();
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'GraphQL query is required' },
        { status: 400 }
      );
    }

    // Exchange token for access token
    const accessToken = await exchangeToken(shop, sessionToken, 'online');

    // Execute GraphQL query
    const result = await graphqlRequest(shop, accessToken, query, variables);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GraphQL proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'GraphQL request failed' },
      { status: 500 }
    );
  }
}

