import { NextResponse } from 'next/server'

/**
 * Atlassian OAuth 2.0 Start Handler
 * Initiates the OAuth 2.0 authorization code flow
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        'Trello OAuth 2.0 (3LO) is not yet available. Please use OAuth 1.0a or manual token connection.',
    },
    { status: 501 }
  )
}
