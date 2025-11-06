import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/lib/shopify';
import prisma from '@/lib/db';

export interface AuthenticatedRequest extends NextRequest {
  shop?: {
    id: string;
    domain: string;
    status: string;
  };
  user?: {
    sub: string;
    aud: string;
  };
}

/**
 * Middleware to authenticate API requests using session tokens
 */
export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
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

      const shopDomain = payload.dest.replace('https://', '');
      
      // Get shop from database
      const shop = await prisma.shop.findUnique({
        where: { domain: shopDomain },
      });

      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        );
      }

      if (shop.status !== 'active') {
        return NextResponse.json(
          { error: 'Shop is not active' },
          { status: 403 }
        );
      }

      // Attach shop and user info to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.shop = {
        id: shop.id,
        domain: shop.domain,
        status: shop.status,
      };
      authenticatedRequest.user = {
        sub: payload.sub,
        aud: payload.aud,
      };

      return handler(authenticatedRequest);
    } catch (error: any) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: error.message || 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to get or create user from session token
 */
export async function getOrCreateUser(shopId: string, sessionPayload: any) {
  const email = sessionPayload.sub || `user-${Date.now()}@shopify.com`;
  const sub = sessionPayload.sub;
  const sid = sessionPayload.sid;

  return await prisma.user.upsert({
    where: {
      shopId_email: {
        shopId,
        email,
      },
    },
    create: {
      shopId,
      email,
      sub,
      sid,
      role: 'merchant',
    },
    update: {
      sub,
      sid,
    },
  });
}

