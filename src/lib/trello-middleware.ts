import { NextRequest, NextResponse } from 'next/server';
import { AuthenticatedRequest } from './auth-middleware';
import prisma from '@/lib/db';
import { createTrelloClient } from './trello';

export interface TrelloAuthenticatedRequest extends AuthenticatedRequest {
  trelloConnection?: {
    id: string;
    token: string;
    trelloMemberId: string;
  };
  trelloClient?: ReturnType<typeof createTrelloClient>;
}

/**
 * Middleware to check Trello connection and provide client
 */
export function withTrello(
  handler: (request: TrelloAuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      if (!request.shop) {
        return NextResponse.json(
          { error: 'Shop not authenticated' },
          { status: 401 }
        );
      }

      // Get Trello connection
      const trelloConnection = await prisma.trelloConnection.findUnique({
        where: { shopId: request.shop.id },
      });

      if (!trelloConnection) {
        return NextResponse.json(
          { error: 'Trello not connected' },
          { status: 401 }
        );
      }

      // Create Trello client
      const trelloClient = createTrelloClient(trelloConnection.token);

      // Attach to request
      const trelloRequest = request as TrelloAuthenticatedRequest;
      trelloRequest.trelloConnection = {
        id: trelloConnection.id,
        token: trelloConnection.token,
        trelloMemberId: trelloConnection.trelloMemberId,
      };
      trelloRequest.trelloClient = trelloClient;

      return handler(trelloRequest);
    } catch (error: any) {
      console.error('Trello middleware error:', error);
      return NextResponse.json(
        { error: error.message || 'Trello authentication failed' },
        { status: 500 }
      );
    }
  };
}

