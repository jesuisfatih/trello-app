import type { NextRequest } from 'next/server'
import { GET as startOAuth1 } from '../../oauth1/start/route'

/**
 * Atlassian OAuth 2.0 Start Handler
 * Initiates the OAuth 2.0 authorization code flow
 */
export async function GET(request: NextRequest) {
  return startOAuth1(request)
}
