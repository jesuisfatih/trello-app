import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import prisma from '@/lib/db';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const settings = await prisma.settings.findUnique({
      where: { shopId: request.shop!.id },
    });

    return NextResponse.json({
      mappings: settings?.mappingOptions || {},
    });
  } catch (error: any) {
    console.error('Get mappings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

async function handlePut(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { mappings } = body;

    const settings = await prisma.settings.upsert({
      where: { shopId: request.shop!.id },
      create: {
        shopId: request.shop!.id,
        mappingOptions: mappings,
      },
      update: {
        mappingOptions: mappings,
      },
    });

    await prisma.eventLog.create({
      data: {
        shopId: request.shop!.id,
        source: 'system',
        type: 'mappings_updated',
        payload: { mappings },
        status: 'success',
      },
    });

    return NextResponse.json({
      mappings: settings.mappingOptions,
      message: 'Mappings updated successfully',
    });
  } catch (error: any) {
    console.error('Update mappings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update mappings' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);

